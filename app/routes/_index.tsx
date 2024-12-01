import { useState, useEffect } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useNavigation } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { AnimeItem } from '~/types/anime';
import { bubbleSort, quickSort } from '~/lib/sorting';

export const loader = async ({ request }: { request: Request }) => {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';

    const response = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}&limit=25`);
    const data = await response.json();

    return json({
      anime: data.data as AnimeItem[],
      pagination: data.pagination,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching anime data:', error);
    return json({
      anime: [] as AnimeItem[],
      pagination: { has_next_page: false },
      currentPage: 1,
    });
  }
};

export default function AnimeIndex() {
  const { anime: initialAnime, pagination, currentPage } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const [anime, setAnime] = useState<AnimeItem[]>(initialAnime);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<{
    field: 'year' | 'score' | null;
    order: 'asc' | 'desc';
  }>({
    field: null,
    order: 'asc',
  });

  // Reset anime and sorting when initial data changes
  useEffect(() => {
    setAnime(initialAnime);
  }, [initialAnime]);

  const handleSearch = () => {
    const filteredAnime = initialAnime.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setAnime(filteredAnime);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Sorting functions
  const handleSort = (field: 'year' | 'score') => {
    const newSortState: { field: 'year' | 'score'; order: 'asc' | 'desc' } = {
      field,
      order: sortState.field === field && sortState.order === 'asc' ? 'desc' : 'asc', // Enforce strict typing here
    };

    let sortedAnime = [...anime];

    if (field === 'year') {
      sortedAnime = bubbleSort(sortedAnime, 'year');
    } else {
      sortedAnime = quickSort(sortedAnime, 'score');
    }

    if (newSortState.order === 'desc') {
      sortedAnime.reverse();
    }

    setAnime(sortedAnime);
    setSortState(newSortState);
  };

  const clearSorting = () => {
    setAnime(initialAnime);
    setSortState({
      field: null,
      order: 'asc',
    });
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.has_next_page) {
      navigate(`?page=${currentPage + 1}`);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      navigate(`?page=${currentPage - 1}`);
    }
  };

  const isLoading = navigation.state === 'loading';

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Anime Index</h1>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-4">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}

      {/* Search and sort */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search anime..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full md:flex-grow"
        />
        <div className="flex space-x-2">
          <Button onClick={handleSearch} className="w-full md:w-auto">
            Search
          </Button>
          <Button
            variant={sortState.field === 'year' ? 'default' : 'outline'}
            onClick={() => handleSort('year')}
            className="w-full md:w-auto flex items-center"
          >
            Sort by Year
            {sortState.field === 'year' && (
              sortState.order === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Button
            variant={sortState.field === 'score' ? 'default' : 'outline'}
            onClick={() => handleSort('score')}
            className="w-full md:w-auto flex items-center"
          >
            Sort by Rating
            {sortState.field === 'score' && (
              sortState.order === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          {sortState.field !== null && (
            <Button
              variant="outline"
              onClick={clearSorting}
              className="w-full md:w-auto flex items-center"
              title="Clear Sorting"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Anime grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {isLoading ? (
          <div className="flex justify-center items-center w-full col-span-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black"></div>
          </div>
        ) : (
          anime.map((item) => (
            <Card key={item.mal_id} className="w-full overflow-hidden">
              <CardHeader className="p-2">
                <CardTitle className="text-sm md:text-base truncate">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="aspect-w-3 aspect-h-4">
                  <img
                    src={item.images.jpg.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 text-xs md:text-sm">
                  <p>Year: {item.year || 'N/A'}</p>
                  <p>Rating: {item.score}/10</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* No reulst state*/}
      {anime.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No anime found. Try a different search or reset filters.
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </Button>
        <span className="text-sm">Page {currentPage}</span>
        <Button variant="outline" onClick={handleNextPage} disabled={!pagination.has_next_page}>
          Next
        </Button>
      </div>
    </div>
  );
}

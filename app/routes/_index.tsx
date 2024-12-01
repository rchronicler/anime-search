import { useState, useEffect } from 'react';
import { json } from '@remix-run/node';
import { MetaFunction, useLoaderData, useNavigate, useNavigation } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react';
import { AnimeItem } from '~/types/anime';
import { bubbleSort, quickSort } from '~/lib/sorting';

export const meta: MetaFunction = () => {
  return [
    { title: "Anime Search" },
    { name: "description", content: "Search Anime..." },
  ];
};

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
  const [animeResult, setAnimeResult] = useState<AnimeItem[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<{
    field: 'year' | 'score' | null;
    order: 'asc' | 'desc';
  }>({
    field: null,
    order: 'asc',
  });
  const [loading, setLoading] = useState(false);

  // Reset anime and sorting when initial data changes
  useEffect(() => {
    setAnime(initialAnime);
  }, [initialAnime]);

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        setAnime(initialAnime);
        setAnimeResult([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, initialAnime]);

  const handleSearch = async () => {
    setLoading(true)

    const filteredAnime = initialAnime.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredAnime.length > 0) {
      setAnime(filteredAnime);
      setLoading(false)
    } else {
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=25`
        );
        const data = await response.json();
        setAnimeResult(data.data || [])
        setAnime(data.data || []);
        setLoading(false)
      } catch (error) {
        console.error('Error fetching search results:', error);
        setAnime([]);
        setLoading(false)
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAnime(initialAnime);
    setAnimeResult([])
  };

  // Sorting functions
  const handleSort = (field: 'year' | 'score') => {
    const newSortState: { field: 'year' | 'score'; order: 'asc' | 'desc' } = {
      field,
      order: sortState.field === field && sortState.order === 'asc' ? 'desc' : 'asc',
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
    setSortState({
      field: null,
      order: 'asc',
    });

    setAnime(animeResult.length > 0 ? animeResult : initialAnime);
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

  const isLoading = navigation.state === 'loading' || loading;

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
      <div className="flex flex-col gap-4 mb-4">
        <div className='flex-grow flex flex-row gap-2'>
          <Input
            type="text"
            placeholder="Search anime..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full flex-grow"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={clearSearch}
              className="flex-shrink"
              title="Clear Search"
            >
              <X className='w-4 h-4' />
            </Button>
          )}
          <Button onClick={handleSearch} className="flex-shrink">
            <Search />
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className='flex gap-2'>
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
          </div>
          {sortState.field !== null && (
            <Button
              variant="outline"
              onClick={clearSorting}
              className="w-full md:w-auto flex items-center"
              title="Clear Sorting"
            >
              Clear sorting
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
            <Card key={item.mal_id} className="w-full overflow-hidden hover:cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-300" onClick={() => {
              window.open(`https://myanimelist.net/anime/${item.mal_id}`, '_blank');
            }}>
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

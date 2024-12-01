import { AnimeItem } from "~/types/anime";

// Bubble sort for sorting by year
export function bubbleSort(arr: AnimeItem[], key: keyof AnimeItem = 'year'): AnimeItem[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      const currentValue = arr[j][key];
      const nextValue = arr[j + 1][key];

      const shouldSwap = key === 'year' 
        ? compareYears(currentValue, nextValue)
        : compareGeneric(currentValue, nextValue);

      if (shouldSwap) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

export function quickSort(arr: AnimeItem[], key: keyof AnimeItem = 'score'): AnimeItem[] {
  if (arr.length <= 1) {
    return arr;
  }

  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];
  
  const left = arr.filter((item, index) => 
    index !== pivotIndex && compareIsLess(item[key], pivot[key], key)
  );
  
  const middle = arr.filter(item => 
    compareIsEqual(item[key], pivot[key], key)
  );
  
  const right = arr.filter((item, index) => 
    index !== pivotIndex && compareIsGreater(item[key], pivot[key], key)
  );

  return [
    ...quickSort(left, key),
    ...middle,
    ...quickSort(right, key)
  ];
}

// Helper function to compare years, handling null/undefined
function compareYears(a: any, b: any): boolean {
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }
  
  if (a === null || a === undefined) {
    return true;
  }
  
  if (b === null || b === undefined) {
    return false;
  }
  
  return a > b;
}

function compareGeneric(a: any, b: any): boolean {
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }
  
  if (a === null || a === undefined) {
    return true;
  }
  
  if (b === null || b === undefined) {
    return false;
  }
  
  return a > b;
}

function compareIsLess(a: any, b: any, key: keyof AnimeItem): boolean {
  if (key === 'year') {
    return compareYears(a, b);
  }
  
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }
  
  if (a === null || a === undefined) {
    return false;
  }
  
  if (b === null || b === undefined) {
    return true;
  }
  
  return a < b;
}

function compareIsEqual(a: any, b: any, key: keyof AnimeItem): boolean {
  if (key === 'year') {
    return a === b;
  }
  
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return true;
  }
  
  return a === b;
}

function compareIsGreater(a: any, b: any, key: keyof AnimeItem): boolean {
  if (key === 'year') {
    return compareYears(b, a);
  }
  
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }
  
  if (a === null || a === undefined) {
    return false;
  }
  
  if (b === null || b === undefined) {
    return true;
  }
  
  return a > b;
}
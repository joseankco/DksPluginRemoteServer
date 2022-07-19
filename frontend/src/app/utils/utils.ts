export function removeDuplicates(array: string[]) {
  return Array.from(new Set(array));
}

export function removeDuplicatesN(array: number[]) {
  return Array.from(new Set(array));
}

export function sortAlphabetically(array: string[]) {
  return array.sort((a, b) => a > b ? 1 : -1);
}

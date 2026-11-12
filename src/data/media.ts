const WIDTHS = [640, 1024, 1600, 2400];

export function photo(id: number, w = 1200) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

export function photoSet(id: number, widths = WIDTHS) {
  return widths.map((w) => `${photo(id, w)} ${w}w`).join(', ');
}

export const media = {
  vision: 6948165,
  vision2: 7608094,
};

import { BookmarkedAnalysis } from '../types';

const STORAGE_KEY = 'creative-control-bookmarks';
const MAX_BOOKMARKS = 25; // Limit to prevent localStorage quota issues

export function getBookmarks(): BookmarkedAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
}

export function addBookmark(bookmark: BookmarkedAnalysis): boolean {
  try {
    const bookmarks = getBookmarks();
    
    // Check if already bookmarked
    if (bookmarks.some(b => b.id === bookmark.id)) {
      return false;
    }
    
    // Add new bookmark
    bookmarks.push(bookmark);
    
    // Limit the number of bookmarks to prevent localStorage quota issues
    // Remove oldest bookmarks if we exceed the limit
    const limitedBookmarks = bookmarks.slice(-MAX_BOOKMARKS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedBookmarks));
    return true;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    
    // If still failing due to quota, try with fewer bookmarks
    try {
      const bookmarks = getBookmarks();
      
      // Check if already bookmarked
      if (bookmarks.some(b => b.id === bookmark.id)) {
        return false;
      }
      
      bookmarks.push(bookmark);
      
      // Try with even fewer bookmarks if quota is still exceeded
      const reducedBookmarks = bookmarks.slice(-Math.floor(MAX_BOOKMARKS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedBookmarks));
      return true;
    } catch (secondError) {
      console.error('Error adding bookmark after reduction:', secondError);
      return false;
    }
  }
}

export function removeBookmark(id: string): boolean {
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
}

export function isBookmarked(id: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === id);
}
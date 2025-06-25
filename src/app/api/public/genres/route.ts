import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { genreService } from '@/services/genreService';

// It's good practice to define a type for your data models.
// You might want to move this to a shared types file, e.g., '@/types/index.ts'
interface Genre {
  id: string; // or number
  name: string;
  isActive: boolean;
  // Add other properties from your genre model if needed
  color?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Explicitly type the result of findAll() as an array of Genre objects.
    const genres: Genre[] = await genreService.findAll();
    
    // Now, TypeScript knows that 'g' is of type 'Genre' and has an 'isActive' property.
    return successResponse(genres.filter(g => g.isActive));
  } catch (error) {
    return handleApiError(error);
  }
}
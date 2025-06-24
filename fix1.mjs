#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

console.log('🚀 Starting Chat 9: Content Discovery System Implementation...\n');

// Helper function to create directories
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

// Helper function to write files
async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  console.log(`✅ Created/Updated: ${filePath}`);
}

// 1. Fix the novelService update method to handle genres and tags properly
const novelServiceContent = `import { prisma } from '@/lib/prisma';
import { serializeForJSON } from '@/lib/utils';

export const novelService = {
  async findAll(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }) {
    const novels = await prisma.novel.findMany({
      ...options,
      include: {
        author: true,
        chapters: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
        ...options?.include,
      },
    });
    return novels.map(serializeForJSON);
  },

  async findById(id: string) {
    const novel = await prisma.novel.findUnique({
      where: { id },
      include: {
        author: true,
        chapters: {
          orderBy: { displayOrder: 'asc' },
        },
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
            reviews: true,
          },
        },
      },
    });
    return novel ? serializeForJSON(novel) : null;
  },

  async create(data: any) {
    const { genreIds, tagIds, ...novelData } = data;
    
    const novel = await prisma.novel.create({
      data: {
        ...novelData,
        ...(genreIds && {
          genres: {
            create: genreIds.map((genreId: string) => ({
              genre: { connect: { id: genreId } }
            }))
          }
        }),
        ...(tagIds && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } }
            }))
          }
        })
      },
      include: {
        author: true,
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
      },
    });
    return serializeForJSON(novel);
  },

  async update(id: string, data: any) {
    const { genreIds, tagIds, ...novelData } = data;
    
    // Handle genres update - delete existing and create new
    if (genreIds !== undefined) {
      await prisma.novelGenre.deleteMany({
        where: { novelId: id }
      });
    }
    
    // Handle tags update - delete existing and create new
    if (tagIds !== undefined) {
      await prisma.novelTag.deleteMany({
        where: { novelId: id }
      });
    }
    
    const novel = await prisma.novel.update({
      where: { id },
      data: {
        ...novelData,
        ...(genreIds !== undefined && {
          genres: {
            create: genreIds.map((genreId: string) => ({
              genre: { connect: { id: genreId } }
            }))
          }
        }),
        ...(tagIds !== undefined && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } }
            }))
          }
        })
      },
      include: {
        author: true,
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
      },
    });
    return serializeForJSON(novel);
  },

  async delete(id: string) {
    const novel = await prisma.novel.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return serializeForJSON(novel);
  },

  async search(query: string, filters?: any) {
    const searchConditions = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { author: { displayName: { contains: query, mode: 'insensitive' } } },
      ],
      AND: [
        { isDeleted: false },
        { isPublished: true },
        ...(filters?.genreIds?.length > 0
          ? [{
              genres: {
                some: {
                  genreId: { in: filters.genreIds }
                }
              }
            }]
          : []),
        ...(filters?.tagIds?.length > 0
          ? [{
              tags: {
                some: {
                  tagId: { in: filters.tagIds }
                }
              }
            }]
          : []),
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.isPremium !== undefined ? [{ isPremium: filters.isPremium }] : []),
      ],
    };

    const novels = await prisma.novel.findMany({
      where: searchConditions,
      include: {
        author: true,
        genres: {
          include: {
            genre: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
      },
      orderBy: filters?.sortBy || { createdAt: 'desc' },
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
    });

    return novels.map(serializeForJSON);
  },

  async getTrending(limit = 10) {
    const novels = await prisma.novel.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
      },
      include: {
        author: true,
        genres: {
          include: {
            genre: true
          }
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
      },
      orderBy: [
        { totalViews: 'desc' },
        { averageRating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return novels.map(serializeForJSON);
  },

  async getRecommendations(userId: string, limit = 10) {
    // Basic recommendation algorithm based on user's reading history
    const userReadingHistory = await prisma.userReadingProgress.findMany({
      where: { userId },
      include: {
        novel: {
          include: {
            genres: true,
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
      take: 10,
    });

    const readNovelIds = userReadingHistory.map(rh => rh.novelId);
    const genreIds = [...new Set(
      userReadingHistory.flatMap(rh => 
        rh.novel.genres.map(g => g.genreId)
      )
    )];

    const recommendations = await prisma.novel.findMany({
      where: {
        id: { notIn: readNovelIds },
        isDeleted: false,
        isPublished: true,
        genres: {
          some: {
            genreId: { in: genreIds }
          }
        }
      },
      include: {
        author: true,
        genres: {
          include: {
            genre: true
          }
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalViews: 'desc' },
      ],
      take: limit,
    });

    return recommendations.map(serializeForJSON);
  },
};`;

// 2. Create Genre Service
const genreServiceContent = `import { prisma } from '@/lib/prisma';
import { serializeForJSON } from '@/lib/utils';

export const genreService = {
  async findAll() {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { novels: true }
        }
      }
    });
    return genres.map(serializeForJSON);
  },

  async findById(id: string) {
    const genre = await prisma.genre.findUnique({
      where: { id },
      include: {
        novels: {
          include: {
            novel: true
          }
        }
      }
    });
    return genre ? serializeForJSON(genre) : null;
  },

  async create(data: any) {
    const genre = await prisma.genre.create({
      data: {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/\\s+/g, '-'),
      }
    });
    return serializeForJSON(genre);
  },

  async update(id: string, data: any) {
    const genre = await prisma.genre.update({
      where: { id },
      data: {
        ...data,
        slug: data.slug || data.name?.toLowerCase().replace(/\\s+/g, '-'),
      }
    });
    return serializeForJSON(genre);
  },

  async delete(id: string) {
    const genre = await prisma.genre.update({
      where: { id },
      data: { isActive: false }
    });
    return serializeForJSON(genre);
  },
};`;

// 3. Create Tag Service
const tagServiceContent = `import { prisma } from '@/lib/prisma';
import { serializeForJSON } from '@/lib/utils';

export const tagService = {
  async findAll(type?: string) {
    const tags = await prisma.tag.findMany({
      where: { 
        isActive: true,
        ...(type && { type })
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { novels: true }
        }
      }
    });
    return tags.map(serializeForJSON);
  },

  async findById(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        novels: {
          include: {
            novel: true
          }
        }
      }
    });
    return tag ? serializeForJSON(tag) : null;
  },

  async create(data: any) {
    const tag = await prisma.tag.create({
      data
    });
    return serializeForJSON(tag);
  },

  async update(id: string, data: any) {
    const tag = await prisma.tag.update({
      where: { id },
      data
    });
    return serializeForJSON(tag);
  },

  async delete(id: string) {
    const tag = await prisma.tag.update({
      where: { id },
      data: { isActive: false }
    });
    return serializeForJSON(tag);
  },

  async incrementUsage(id: string) {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        usageCount: { increment: 1 }
      }
    });
    return serializeForJSON(tag);
  }
};`;

// 4. Create Search Service
const searchServiceContent = `import { prisma } from '@/lib/prisma';
import { serializeForJSON } from '@/lib/utils';

export const searchService = {
  async searchAll(query: string, options?: {
    type?: 'novel' | 'chapter' | 'user';
    limit?: number;
    offset?: number;
  }) {
    const results: any = {
      novels: [],
      chapters: [],
      users: [],
    };

    // Search novels
    if (!options?.type || options.type === 'novel') {
      const novels = await prisma.novel.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isDeleted: false,
          isPublished: true,
        },
        include: {
          author: true,
          genres: {
            include: {
              genre: true
            }
          },
          _count: {
            select: {
              chapters: true,
              ratings: true,
            },
          },
        },
        take: options?.limit || 10,
        skip: options?.offset || 0,
      });
      results.novels = novels.map(serializeForJSON);
    }

    // Search chapters
    if (!options?.type || options.type === 'chapter') {
      const chapters = await prisma.chapter.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
          isDeleted: false,
          isPublished: true,
          novel: {
            isDeleted: false,
            isPublished: true,
          },
        },
        include: {
          novel: {
            include: {
              author: true,
            },
          },
        },
        take: options?.limit || 10,
        skip: options?.offset || 0,
      });
      results.chapters = chapters.map(serializeForJSON);
    }

    // Search users
    if (!options?.type || options.type === 'user') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          _count: {
            select: {
              novels: true,
              followers: true,
            },
          },
        },
        take: options?.limit || 10,
        skip: options?.offset || 0,
      });
      results.users = users;
    }

    return results;
  },

  async createSearchIndex() {
    // This would typically create database indexes for better search performance
    // For now, we'll use Prisma's built-in text search
    console.log('Search indexes created/updated');
  },
};`;

// 5. Create API routes for genres
const genresRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import { genreService } from '@/services/genreService';
import { authMiddleware } from '@/lib/auth';

export async function GET() {
  try {
    const genres = await genreService.findAll();
    return NextResponse.json({ data: genres });
  } catch (error) {
    console.error('GET /api/admin/genres error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authMiddleware(req, ['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const genre = await genreService.create(data);
    return NextResponse.json({ data: genre });
  } catch (error) {
    console.error('POST /api/admin/genres error:', error);
    return NextResponse.json(
      { error: 'Failed to create genre' },
      { status: 500 }
    );
  }
}`;

// 6. Create API routes for tags
const tagsRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import { tagService } from '@/services/tagService';
import { authMiddleware } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    
    const tags = await tagService.findAll(type);
    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error('GET /api/admin/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authMiddleware(req, ['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const tag = await tagService.create(data);
    return NextResponse.json({ data: tag });
  } catch (error) {
    console.error('POST /api/admin/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}`;

// 7. Create Search API route
const searchRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/services/searchService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') as 'novel' | 'chapter' | 'user' | undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const results = await searchService.searchAll(query, { type, limit, offset });
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}`;

// 8. Create Genre Management Component
const genreManagementContent = `'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  sortOrder: number;
  _count?: {
    novels: number;
  };
}

// 9. Create Tag Management Component
const tagManagementContent = `'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/admin/genres');
      const data = await response.json();
      setGenres(data.data || []);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGenre
        ? `/api/admin/genres/${editingGenre.id}`
        : '/api/admin/genres';
      
      const response = await fetch(url, {
        method: editingGenre ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchGenres();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Failed to save genre:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this genre?')) return;

    try {
      const response = await fetch(`/api/admin/genres/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGenres();
      }
    } catch (error) {
      console.error('Failed to delete genre:', error);
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || '',
      color: genre.color,
      sortOrder: genre.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGenre(null);
    setFormData({
      name: '',
      description: '',
      color: '#6B7280',
      sortOrder: 0,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Genre Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Genre
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Sort Order</TableHead>
            <TableHead>Novels</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genres.map((genre) => (
            <TableRow key={genre.id}>
              <TableCell className="font-medium">{genre.name}</TableCell>
              <TableCell>{genre.slug}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {genre.color}
                  </span>
                </div>
              </TableCell>
              <TableCell>{genre.sortOrder}</TableCell>
              <TableCell>{genre._count?.novels || 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(genre)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(genre.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGenre ? 'Edit Genre' : 'Add New Genre'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGenre ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

// 9. Create Tag Management Component
const tagManagementContent = `'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  type: string;
  color: string;
  usageCount: number;
  _count?: {
    novels: number;
  };
}

export default function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'theme',
    color: '#9CA3AF',
  });

  useEffect(() => {
    fetchTags();
  }, [filterType]);

  const fetchTags = async () => {
    try {
      const url = filterType === 'all' 
        ? '/api/admin/tags'
        : `/api/admin/tags?type=${filterType}`;
      const response = await fetch(url);
      const data = await response.json();
      setTags(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTag
        ? `/api/admin/tags/${editingTag.id}`
        : '/api/admin/tags';
      
      const response = await fetch(url, {
        method: editingTag ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTags();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Failed to save tag:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      type: tag.type,
      color: tag.color,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    setFormData({
      name: '',
      type: 'theme',
      color: '#9CA3AF',
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tag Management</h1>
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="theme">Theme</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="demographic">Demographic</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Usage Count</TableHead>
            <TableHead>Novels</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell className="font-medium">{tag.name}</TableCell>
              <TableCell className="capitalize">{tag.type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {tag.color}
                  </span>
                </div>
              </TableCell>
              <TableCell>{tag.usageCount}</TableCell>
              <TableCell>{tag._count?.novels || 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Add New Tag'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theme">Theme</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="demographic">Demographic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingTag ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

// 10. Update NovelForm to include genres and tags
const novelFormUpdateContent = `// Add this to the NovelForm component imports
import { useEffect, useState } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';

// Add these interfaces
interface Genre {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  type: string;
  color: string;
}

// Add these state variables inside NovelForm component
const [genres, setGenres] = useState<Genre[]>([]);
const [tags, setTags] = useState<Tag[]>([]);
const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

// Add this useEffect to fetch genres and tags
useEffect(() => {
  fetchGenres();
  fetchTags();
}, []);

const fetchGenres = async () => {
  try {
    const response = await fetch('/api/admin/genres');
    const data = await response.json();
    setGenres(data.data || []);
  } catch (error) {
    console.error('Failed to fetch genres:', error);
  }
};

const fetchTags = async () => {
  try {
    const response = await fetch('/api/admin/tags');
    const data = await response.json();
    setTags(data.data || []);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
  }
};

// Update the form submission to include genreIds and tagIds
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... existing code ...
  
  const novelData = {
    ...formData,
    genreIds: selectedGenreIds,
    tagIds: selectedTagIds,
  };
  
  // ... rest of submission logic ...
};

// Add these form fields in the JSX
<div className="space-y-2">
  <Label htmlFor="genres">Genres</Label>
  <MultiSelect
    options={genres.map(g => ({ value: g.id, label: g.name }))}
    selected={selectedGenreIds}
    onChange={setSelectedGenreIds}
    placeholder="Select genres..."
  />
</div>

<div className="space-y-2">
  <Label htmlFor="tags">Tags</Label>
  <MultiSelect
    options={tags.map(t => ({ 
      value: t.id, 
      label: t.name,
      group: t.type 
    }))}
    selected={selectedTagIds}
    onChange={setSelectedTagIds}
    placeholder="Select tags..."
    grouped
  />
</div>`;

// 11. Create MultiSelect component
const multiSelectContent = `import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  grouped?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  grouped = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  );

  const groupedOptions = React.useMemo(() => {
    if (!grouped) return { '': options };
    
    return options.reduce((acc, option) => {
      const group = option.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, Option[]>);
  }, [options, grouped]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1"
                >
                  {option.label}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRemove(option.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleRemove(option.value)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedOptions).map(([group, groupOptions]) => (
            <CommandGroup key={group} heading={group}>
              {groupOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  );
}`;

// Now let's write all the files
async function implementContentDiscovery() {
  try {
    // Services
    await writeFile('src/services/novelService.ts', novelServiceContent);
    await writeFile('src/services/genreService.ts', genreServiceContent);
    await writeFile('src/services/tagService.ts', tagServiceContent);
    await writeFile('src/services/searchService.ts', searchServiceContent);

    // API Routes
    await writeFile('src/app/api/admin/genres/route.ts', genresRouteContent);
    await writeFile('src/app/api/admin/tags/route.ts', tagsRouteContent);
    await writeFile('src/app/api/search/route.ts', searchRouteContent);

    // Admin Pages
    await writeFile('src/app/(admin)/admin/content/genres/page.tsx', genreManagementContent);
    await writeFile('src/app/(admin)/admin/content/tags/page.tsx', tagManagementContent);

    // Components
    await writeFile('src/components/ui/multi-select.tsx', multiSelectContent);

    console.log('\n📝 NovelForm Update Instructions:');
    console.log('Please manually update the NovelForm component with the following changes:');
    console.log(novelFormUpdateContent);

    console.log('\n✅ Content Discovery System implementation completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run database migrations to ensure Genre, Tag, NovelGenre, and NovelTag tables exist');
    console.log('2. Update the NovelForm and EditNovelForm components to include genre and tag selection');
    console.log('3. Add navigation links to the genre and tag management pages in the admin sidebar');
    console.log('4. Test the search functionality and genre/tag filtering');

  } catch (error) {
    console.error('❌ Error during implementation:', error);
  }
}

// Run the implementation
implementContentDiscovery();

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListChecks, PlusCircle, Trash2, Edit, Loader2, Sparkles, Image as ImageIcon, Home, Briefcase, Heart, Building, Wrench, Paintbrush, PenSquare, Zap, CookingPot, Laptop, LandPlot, Code, FilePieChart, Megaphone, Brushes, Cog } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, deleteField, Timestamp } from 'firebase/firestore';
import type { Category } from '@/types';

const IconComponent = ({ iconName }: { iconName?: string }) => {
  if (!iconName) return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
  const Icon = (LucideIcons as any)[iconName];
  if (Icon) {
    return <Icon className="h-4 w-4" />;
  }
  return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
};

const MOCK_CATEGORIES: Category[] = [
    { id: 'cat1', name: 'Interior Design', icon: 'Home', createdAt: Timestamp.fromDate(new Date()), vendorCount: 5 },
    { id: 'cat2', name: 'Electronics', icon: 'Laptop', createdAt: Timestamp.fromDate(new Date()), vendorCount: 12 },
    { id: 'cat3', name: 'Legal Services', icon: 'Briefcase', createdAt: Timestamp.fromDate(new Date()), vendorCount: 8 },
    { id: 'cat4', name: 'Healthcare', icon: 'Heart', createdAt: Timestamp.fromDate(new Date()), vendorCount: 20 },
    { id: 'cat5', name: 'Real Estate', icon: 'Building', createdAt: Timestamp.fromDate(new Date()), vendorCount: 15 },
    { id: 'cat6', name: 'Design', icon: 'Paintbrush', createdAt: Timestamp.fromDate(new Date()), vendorCount: 3 },
    { id: 'cat7', name: 'Plumbing', icon: 'Wrench', createdAt: Timestamp.fromDate(new Date()), vendorCount: 7 },
    { id: 'cat8', name: 'Writing & Content', icon: 'PenSquare', createdAt: Timestamp.fromDate(new Date()), vendorCount: 4 },
    { id: 'cat9', name: 'Electrician', icon: 'Zap', createdAt: Timestamp.fromDate(new Date()), vendorCount: 9 },
    { id: 'cat10', name: 'Catering', icon: 'CookingPot', createdAt: Timestamp.fromDate(new Date()), vendorCount: 6 },
    { id: 'cat11', name: 'IT Support', icon: 'Cog', createdAt: Timestamp.fromDate(new Date()), vendorCount: 11 },
    { id: 'cat12', name: 'Cleaning Services', icon: 'Brushes', createdAt: Timestamp.fromDate(new Date()), vendorCount: 14 },
    { id: 'cat13', name: 'Landscaping', icon: 'LandPlot', createdAt: Timestamp.fromDate(new Date()), vendorCount: 5 },
    { id: 'cat14', name: 'Web Development', icon: 'Code', createdAt: Timestamp.fromDate(new Date()), vendorCount: 18 },
    { id: 'cat15', name: 'Accounting', icon: 'FilePieChart', createdAt: Timestamp.fromDate(new Date()), vendorCount: 10 },
    { id: 'cat16', name: 'Marketing', icon: 'Megaphone', createdAt: Timestamp.fromDate(new Date()), vendorCount: 13 },
];


export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "categories"), orderBy("name"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedCategories: Category[] = [];
            querySnapshot.forEach((doc) => {
                fetchedCategories.push({ id: doc.id, ...doc.data() } as Category);
            });
            if (fetchedCategories.length === 0) {
                console.log("No live categories found, using mock data.");
                setCategories(MOCK_CATEGORIES);
            } else {
                setCategories(fetchedCategories);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            toast.error('Error: Could not fetch categories. Displaying mock data.');
            setCategories(MOCK_CATEGORIES);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || isProcessing) {
            if (!newCategoryName.trim()) toast.error('Error: Category name cannot be empty.');
            return;
        }
        setIsProcessing(true);
        try {
            await addDoc(collection(db, "categories"), {
                name: newCategoryName.trim(),
                icon: newCategoryIcon.trim() || undefined,
                createdAt: serverTimestamp(),
                vendorCount: 0
            });
            toast.success(`Category Added: "${newCategoryName.trim()}" has been added.`);
            setNewCategoryName('');
            setNewCategoryIcon('');
        } catch (error) {
             console.error("Error adding category: ", error);
             toast.error('Error: Failed to add category.');
        } finally {
             setIsProcessing(false);
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim() || isProcessing) {
            if (editingCategory && !editingCategory.name.trim()) toast.error('Error: Category name cannot be empty.');
            setEditingCategory(null);
            return;
        }
        setIsProcessing(true);
        const categoryRef = doc(db, "categories", editingCategory.id!);
        try {
            await updateDoc(categoryRef, {
                name: editingCategory.name.trim(),
                icon: editingCategory.icon?.trim() ? editingCategory.icon.trim() : deleteField()
            });
            toast.success(`Category Updated: Category updated to "${editingCategory.name.trim()}".`);
            setEditingCategory(null);
        } catch (error) {
             console.error("Error updating category: ", error);
             toast.error('Error: Failed to update category.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
         if (isProcessing) return;
         if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
             setIsProcessing(true);
             const categoryRef = doc(db, "categories", categoryId);
            try {
                await deleteDoc(categoryRef);
                toast.error(`Category Deleted: "${categoryName}" has been deleted.`);
            } catch (error) {
                 console.error("Error deleting category: ", error);
                 toast.error('Error: Failed to delete category.');
            } finally {
                setIsProcessing(false);
            }
         }
    };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Manage Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Add a new category for vendors. You can specify a Lucide icon name.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
           <Input
              placeholder="Enter category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isProcessing}
              className="flex-grow"
            />
            <Input
              placeholder="Lucide Icon Name (e.g., Home)"
              value={newCategoryIcon}
              onChange={(e) => setNewCategoryIcon(e.target.value)}
              disabled={isProcessing}
              className="flex-grow"
            />
           <Button onClick={handleAddCategory} disabled={isProcessing || !newCategoryName.trim()} className="w-full sm:w-auto">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Category
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
           <CardDescription>View, edit, or delete existing service/product categories.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
           ) : (
               <div className="overflow-x-auto">
                 <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead className="w-12">Icon</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Icon Name</TableHead>
                      <TableHead>Vendor Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {categories.map((category) => (
                      <TableRow key={category.id}>
                      <TableCell><IconComponent iconName={category.icon} /></TableCell>
                      <TableCell>
                          {editingCategory?.id === category.id ? (
                              <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory!, name: e.target.value })}
                                  className="h-8"
                                  autoFocus
                                  disabled={isProcessing}
                              />
                          ) : (
                              category.name
                          )}
                      </TableCell>
                      <TableCell>
                          {editingCategory?.id === category.id ? (
                              <Input
                                  value={editingCategory.icon || ''}
                                  onChange={(e) => setEditingCategory({ ...editingCategory!, icon: e.target.value })}
                                  placeholder="Lucide Icon (e.g. Home)"
                                  className="h-8"
                                  disabled={isProcessing}
                              />
                          ) : (
                              <span className="text-muted-foreground text-xs">{category.icon || '-'}</span>
                          )}
                      </TableCell>
                      <TableCell>{category.vendorCount || 0}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                          {editingCategory?.id === category.id ? (
                              <Button variant="ghost" size="icon" onClick={handleUpdateCategory} className="text-green-600 hover:text-green-700" disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                              <span className="sr-only">Save</span>
                              </Button>
                          ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)} disabled={isProcessing || !!editingCategory}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                              </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteCategory(category.id!, category.name)} disabled={isProcessing || editingCategory?.id === category.id}>
                          {isProcessing && editingCategory?.id !== category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          <span className="sr-only">Delete</span>
                          </Button>
                      </TableCell>
                      </TableRow>
                  ))}
                  {categories.length === 0 && !isLoading && (
                      <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No categories found.</TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table>
               </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/graphql/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Folder, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLLECTIONS_QUERY = `
  query Collections {
    collections {
      id
      name
      description
      createdAt
      updatedAt
      entries {
        id
      }
    }
  }
`;

const CREATE_COLLECTION_MUTATION = `
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      name
    }
  }
`;

const DELETE_COLLECTION_MUTATION = `
  mutation DeleteCollection($id: ID!) {
    deleteCollection(id: $id)
  }
`;

interface CollectionListProps {
  onSelectCollection: (id: string) => void;
}

export function CollectionList({ onSelectCollection }: CollectionListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");

  const { data, loading, error, refetch } = useQuery<{ collections: any[] }>(COLLECTIONS_QUERY);
  
  const createCollectionMutation = useMutation(CREATE_COLLECTION_MUTATION);
  const deleteCollectionMutation = useMutation(DELETE_COLLECTION_MUTATION);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      await createCollectionMutation.execute({
        input: {
          name: newCollectionName,
          description: newCollectionDesc,
        },
      });
      setShowCreateDialog(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      refetch();
      toast.success("Collection created");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create collection");
      console.error("Error creating collection:", error);
    }
  };

  const handleDeleteCollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This won't delete the memories inside.")) return;

    try {
      await deleteCollectionMutation.execute({ id });
      refetch();
      toast.success("Collection deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete collection");
      console.error("Error deleting collection:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
            <p className="text-destructive">Error loading collections</p>
          </div>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const collections = data?.collections || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            Group your memories into organized lists
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first collection to organize your memories
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
          <Card 
            key={collection.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectCollection(collection.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" />
                  {collection.name}
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDeleteCollection(e, collection.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {collection.description || "No description"}
              </CardDescription>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(collection.updatedAt).toLocaleDateString()}
                <span className="mx-2">•</span>
                {collection.entries.length} items
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your memories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., React Learning Path"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder="What's this collection about?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

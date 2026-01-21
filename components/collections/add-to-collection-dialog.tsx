"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/graphql/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, Plus, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLLECTIONS_QUERY = `
  query Collections {
    collections {
      id
      name
      description
      entries {
        id
      }
    }
  }
`;

const ADD_TO_COLLECTION_MUTATION = `
  mutation AddEntryToCollection($collectionId: ID!, $entryId: ID!) {
    addEntryToCollection(collectionId: $collectionId, entryId: $entryId) {
      id
      entries {
        id
      }
    }
  }
`;

interface AddToCollectionDialogProps {
  entryId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function AddToCollectionDialog({
  entryId,
  onOpenChange,
}: AddToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{ collections: any[] }>(COLLECTIONS_QUERY);
  const addMutation = useMutation(ADD_TO_COLLECTION_MUTATION);

  const handleAddToCollection = async () => {
    if (!entryId || !selectedCollectionId) return;

    try {
      await addMutation.execute({
        collectionId: selectedCollectionId,
        entryId,
      });
      toast.success("Added to collection");
      onOpenChange(false);
      setSelectedCollectionId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to add to collection");
      console.error("Error adding to collection:", error);
    }
  };

  const collections = data?.collections || [];

  return (
    <Dialog open={!!entryId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Choose a collection to save this memory to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">
              Failed to load collections
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No collections found</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {collections.map((collection) => {
                  const isAlreadyIn = collection.entries.some((e: any) => e.id === entryId);
                  const isSelected = selectedCollectionId === collection.id;
                  
                  return (
                    <div
                      key={collection.id}
                      onClick={() => !isAlreadyIn && setSelectedCollectionId(collection.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected && "border-primary bg-primary/5",
                        isAlreadyIn && "opacity-50 cursor-not-allowed bg-muted",
                        !isAlreadyIn && !isSelected && "hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{collection.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {collection.entries.length} items
                          </p>
                        </div>
                      </div>
                      
                      {isAlreadyIn && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Added
                        </span>
                      )}
                      
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddToCollection} 
            disabled={!selectedCollectionId || loading}
          >
            Add to Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

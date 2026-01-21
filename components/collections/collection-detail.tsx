"use client";

import { useQuery, useMutation } from "@/lib/graphql/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { MemoryGrid } from "@/components/ui/memory-grid";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AddMemoryDialog } from "./add-memory-dialog";
import { useState } from "react";
import { Plus } from "lucide-react";

const COLLECTION_QUERY = `
  query Collection($id: ID!) {
    collection(id: $id) {
      id
      name
      description
      entries {
        id
        title
        content
        type
        language
        url
        createdAt
        updatedAt
        tags {
          id
          name
          color
        }
        fromRelations {
          id
        }
        toRelations {
          id
        }
      }
    }
  }
`;

const REMOVE_ENTRY_MUTATION = `
  mutation RemoveEntryFromCollection($collectionId: ID!, $entryId: ID!) {
    removeEntryFromCollection(collectionId: $collectionId, entryId: $entryId) {
      id
    }
  }
`;

const DELETE_ENTRY_MUTATION = `
  mutation DeleteEntry($id: ID!) {
    deleteEntry(id: $id)
  }
`;

interface CollectionDetailProps {
  collectionId: string;
  onBack: () => void;
  onEditEntry: (entry: any) => void;
  onNavigateToEntry: (id: string) => void;
}

export function CollectionDetail({ 
  collectionId, 
  onBack,
  onEditEntry,
  onNavigateToEntry
}: CollectionDetailProps) {
  const { data, loading, error, refetch } = useQuery<{ collection: any }>(
    COLLECTION_QUERY, 
    { id: collectionId },
    [collectionId]
  );
  
  const [showAddMemory, setShowAddMemory] = useState(false);
  
  const removeEntryMutation = useMutation(REMOVE_ENTRY_MUTATION);
  const deleteEntryMutation = useMutation(DELETE_ENTRY_MUTATION);

  const handleRemoveEntry = async (entryId: string) => {
    try {
      await removeEntryMutation.execute({
        collectionId,
        entryId
      });
      refetch();
      toast.success("Memory removed from collection");
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove memory");
      console.error("Error removing entry:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm("Are you sure you want to delete this memory entirely?")) {
      try {
        await deleteEntryMutation.execute({ id });
        refetch();
        toast.success("Memory deleted");
      } catch (error: any) {
        toast.error("Failed to delete: " + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.collection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-destructive">
              {error ? "Error loading collection" : "Collection not found"}
            </h2>
            {error && <p className="text-muted-foreground">{error.toString()}</p>}
          </div>
        </div>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const collection = data.collection;
  const isEmpty = collection.entries.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{collection.name}</h2>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <Button onClick={() => setShowAddMemory(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Memory
        </Button>
      </div>

      <Separator />

      <AddMemoryDialog
        collectionId={collectionId}
        currentEntryIds={collection.entries.map((e: any) => e.id)}
        open={showAddMemory}
        onOpenChange={setShowAddMemory}
        onSuccess={() => refetch()}
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No memories in this collection</h3>
          <p className="text-muted-foreground mb-4">
            Add memories to this collection from your dashboard
          </p>
          <Button onClick={() => setShowAddMemory(true)}>
            Add Memory
          </Button>
        </div>
      ) : (
        <MemoryGrid
          memories={collection.entries}
          onEdit={onEditEntry}
          onDelete={handleDeleteEntry}
          onSelect={(entry) => onNavigateToEntry(entry.id)}
          onAddNew={() => {}}
          searchQuery=""
          selectedType="all"
          title={`${collection.entries.length} Items`}
        />
      )}
    </div>
  );
}

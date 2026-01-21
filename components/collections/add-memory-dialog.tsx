"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check } from "lucide-react";
import { useQuery, useMutation } from "@/lib/graphql/client";
import { toast } from "sonner";

interface AddMemoryDialogProps {
  collectionId: string;
  currentEntryIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ENTRIES_QUERY = `
  query Entries($search: String) {
    entries(search: $search) {
      id
      title
      type
      updatedAt
    }
  }
`;

const ADD_ENTRY_MUTATION = `
  mutation AddEntryToCollection($collectionId: ID!, $entryId: ID!) {
    addEntryToCollection(collectionId: $collectionId, entryId: $entryId) {
      id
    }
  }
`;

export function AddMemoryDialog({
  collectionId,
  currentEntryIds,
  open,
  onOpenChange,
  onSuccess,
}: AddMemoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const { data, loading } = useQuery<{ entries: any[] }>(ENTRIES_QUERY, {
    search: searchTerm,
  }, [searchTerm]);

  const addEntryMutation = useMutation(ADD_ENTRY_MUTATION);

  const handleAdd = async (entryId: string) => {
    try {
      await addEntryMutation.execute({ collectionId, entryId });
      toast.success("Memory added to collection");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add memory:", error);
      toast.error("Failed to add memory to collection");
    }
  };

  const filteredEntries = data?.entries.filter(
    (entry) => !currentEntryIds.includes(entry.id)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Memory to Collection</DialogTitle>
          <DialogDescription>
            Search and select a memory to add to this collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No compatible memories found
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="text-sm font-medium truncate">
                        {entry.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleAdd(entry.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

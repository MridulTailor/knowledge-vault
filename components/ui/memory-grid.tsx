"use client";

import { EntryCard } from "@/components/entries/entry-card";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Archive } from "lucide-react";

interface Memory {
  id: string;
  title: string;
  content: string;
  type: "ARTICLE" | "CODE_SNIPPET" | "BOOKMARK";
  language?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string; color?: string }>;
  fromRelations: Array<{
    id: string;
    type?: string;
    description?: string;
    toEntry: { id: string; title: string };
  }>;
  toRelations: Array<{
    id: string;
    type?: string;
    description?: string;
    fromEntry: { id: string; title: string };
  }>;
}

interface MemoryGridProps {
  memories: Memory[];
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onSelect: (memory: Memory) => void;
  onAddNew: () => void;
  isLoading?: boolean;
  searchQuery?: string;
  selectedType?: string;
  title?: string;
  onAddToCollection?: (id: string) => void;
}

export function MemoryGrid({
  memories,
  onEdit,
  onDelete,
  onSelect,
  onAddNew,
  isLoading = false,
  searchQuery = "",
  selectedType = "all",
  title = "Your Memories",
  onAddToCollection,
}: MemoryGridProps) {
  const getEmptyStateMessage = () => {
    if (searchQuery || selectedType !== "all") {
      return {
        title: "No memories found",
        description: "Try adjusting your search criteria or filters",
        action: "Clear filters",
      };
    }
    return {
      title: "Start building your digital memory",
      description:
        "Create your first memory to begin organizing your knowledge",
      action: "Add your first memory",
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 bg-muted rounded w-32" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-6 border h-48 animate-pulse"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const emptyState = getEmptyStateMessage();

  if (memories.length === 0) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            {searchQuery || selectedType !== "all" ? (
              <Archive className="h-10 w-10 text-muted-foreground" />
            ) : (
              <Brain className="h-10 w-10 text-muted-foreground" />
            )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">
            {emptyState.title}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {emptyState.description}
          </p>
        </div>
        <Button
          onClick={onAddNew}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">{emptyState.action}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-sm font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted">
          {memories.length} {memories.length === 1 ? "memory" : "memories"}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {memories.map((memory) => (
          <div key={memory.id}>
            <EntryCard
              entry={memory}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              onAddToCollection={onAddToCollection}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

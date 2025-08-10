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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="glass-effect rounded-lg p-6 border border-border/50 animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted/30 rounded"></div>
                  <div className="h-3 bg-muted/30 rounded w-2/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-5 bg-muted/30 rounded w-12"></div>
                  <div className="h-5 bg-muted/30 rounded w-16"></div>
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
      <div className="text-center py-16 space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          {searchQuery || selectedType !== "all" ? (
            <Archive className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Brain className="h-12 w-12 text-primary" />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {emptyState.title}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {emptyState.description}
          </p>
        </div>
        <Button
          onClick={onAddNew}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          {emptyState.action}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="text-sm text-muted-foreground">
          {memories.length} {memories.length === 1 ? "memory" : "memories"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {memories.map((memory, index) => (
          <div
            key={memory.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <EntryCard
              entry={memory}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

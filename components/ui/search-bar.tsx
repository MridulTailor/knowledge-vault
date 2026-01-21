"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onTypeFilter: (type: string) => void;
  onTagFilter: (tags: string[]) => void;
  availableTags?: Array<{ id: string; name: string; color?: string }>;
  className?: string;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onTypeFilter,
  onTagFilter,
  availableTags = [],
  className,
  placeholder = "Search your memories...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    onTypeFilter(type);
  };

  const toggleTag = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newTags);
    onTagFilter(newTags);
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedType("all");
    setSelectedTags([]);
    onSearch("");
    onTypeFilter("all");
    onTagFilter([]);
  };

  const hasActiveFilters =
    query || selectedType !== "all" || selectedTags.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-20 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-8 w-8 p-0",
              showFilters && "bg-accent"
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card rounded-lg p-4 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ARTICLE">📄 Articles</SelectItem>
                <SelectItem value="CODE_SNIPPET">💻 Code</SelectItem>
                <SelectItem value="BOOKMARK">🔖 Bookmarks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.name) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.name)}
                    style={{
                      backgroundColor: selectedTags.includes(tag.name)
                        ? undefined
                        : tag.color
                        ? `${tag.color}15`
                        : undefined,
                      borderColor: tag.color ? `${tag.color}40` : undefined,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

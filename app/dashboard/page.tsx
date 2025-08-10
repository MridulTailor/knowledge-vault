"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useQuery, useMutation } from "@/lib/graphql/client";
import { MainLayout } from "@/components/layout/main-layout";
import { WelcomeBanner } from "@/components/ui/welcome-banner";
import { SearchBar } from "@/components/ui/search-bar";
import { MemoryGrid } from "@/components/ui/memory-grid";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { EntryDetail } from "@/components/entries/entry-detail";
import { EntryForm } from "@/components/entries/entry-form";
import { ExportImport } from "@/components/entries/export-import";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EntryCard } from "@/components/entries/entry-card";
import {
  Zap,
  User,
  LogOut,
  Search,
  Download,
  Plus,
  Sparkles,
  FileText,
  Code,
  Bookmark,
  Users,
} from "lucide-react";

const ENTRIES_QUERY = `
  query Entries($search: String, $tagNames: [String!], $type: EntryType) {
    entries(search: $search, tagNames: $tagNames, type: $type) {
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
        toEntry {
          id
          title
        }
      }
      toRelations {
        id
        fromEntry {
          id
          title
        }
      }
    }
  }
`;

const TAGS_QUERY = `
  query Tags {
    tags {
      id
      name
      color
    }
  }
`;

const DELETE_ENTRY_MUTATION = `
  mutation DeleteEntry($id: ID!) {
    deleteEntry(id: $id)
  }
`;

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // Updated default value
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showExportImport, setShowExportImport] = useState(false);

  // Redirect to auth if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth");
  };

  const { data: entriesData, refetch: refetchEntries } = useQuery<{
    entries: any[];
  }>(
    ENTRIES_QUERY,
    {
      search: searchTerm || undefined,
      tagNames: selectedTags.length > 0 ? selectedTags : undefined,
      type: selectedType === "all" ? undefined : selectedType, // Updated condition
    },
    [searchTerm, selectedTags, selectedType]
  );

  const { data: tagsData } = useQuery<{ tags: any[] }>(TAGS_QUERY);

  const deleteEntryMutation = useMutation<{ deleteEntry: boolean }>(
    DELETE_ENTRY_MUTATION
  );

  const handleDeleteEntry = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteEntryMutation.execute({ id });
        refetchEntries();
        setSelectedEntry(null); // Close detail view if open
        toast.success("Entry deleted successfully");
      } catch (error: any) {
        console.error("Failed to delete entry:", error);
        toast.error("Failed to delete entry: " + error.message);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntry(null);
    refetchEntries();
    toast.success(
      editingEntry ? "Entry updated successfully" : "Entry created successfully"
    );
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleNavigateToEntry = (entryId: string) => {
    const entry = entriesData?.entries.find((e) => e.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              Loading your knowledge vault...
            </p>
            <p className="text-sm text-muted-foreground">
              Preparing your digital sanctuary
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect via useEffect)
  if (!user) {
    return null;
  }

  if (showExportImport) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <ExportImport onClose={() => setShowExportImport(false)} />
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6">
          <EntryForm
            entry={editingEntry}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <EntryDetail
            entry={selectedEntry}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onBack={() => setSelectedEntry(null)}
            onNavigateToEntry={handleNavigateToEntry}
            onRefresh={() => {
              refetchEntries();
              // Update the selected entry with fresh data
              const updatedEntry = entriesData?.entries.find(
                (e) => e.id === selectedEntry.id
              );
              if (updatedEntry) {
                setSelectedEntry(updatedEntry);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Futuristic Header */}
      <header className="glass-effect border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Knowledge Vault
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-1.5 rounded-lg bg-card/50 border border-border/50">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Controls Section */}
        <div className="mb-8 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your knowledge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card transition-all duration-200"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="ARTICLE">📄 Articles</SelectItem>
                  <SelectItem value="CODE_SNIPPET">💻 Code</SelectItem>
                  <SelectItem value="BOOKMARK">🔖 Bookmarks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowExportImport(true)}
                className="border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export/Import
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>

          {/* Futuristic Tag Filters */}
          {tagsData?.tags && (
            <div className="flex flex-wrap gap-2 items-center animate-slide-in">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Filter by tags:</span>
              </div>
              {tagsData.tags.slice(0, 12).map((tag) => (
                <Badge
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.name) ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedTags.includes(tag.name)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-effect rounded-lg p-4 border border-border/50">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {entriesData?.entries.filter((e) => e.type === "ARTICLE")
                      .length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Articles</p>
                </div>
              </div>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-border/50">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {entriesData?.entries.filter(
                      (e) => e.type === "CODE_SNIPPET"
                    ).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Code Snippets</p>
                </div>
              </div>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-border/50">
              <div className="flex items-center space-x-2">
                <Bookmark className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {entriesData?.entries.filter((e) => e.type === "BOOKMARK")
                      .length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Bookmarks</p>
                </div>
              </div>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-border/50">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {tagsData?.tags.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Tags</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Entries Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {entriesData?.entries.map((entry: any, index: number) => (
            <div
              key={entry.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <EntryCard
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onSelect={setSelectedEntry}
              />
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {entriesData?.entries.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || selectedTags.length > 0 || selectedType !== "all"
                ? "No entries found"
                : "Start building your knowledge vault"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || selectedTags.length > 0 || selectedType !== "all"
                ? "Try adjusting your search criteria or filters"
                : "Create your first entry to begin organizing your digital knowledge"}
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

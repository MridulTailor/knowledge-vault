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
        type
        description
        toEntry {
          id
          title
        }
      }
      toRelations {
        id
        type
        description
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
  const [activeView, setActiveView] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Redirect to auth if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const { data: entriesData, refetch: refetchEntries } = useQuery<{
    entries: any[];
  }>(
    ENTRIES_QUERY,
    {
      search: searchTerm || undefined,
      tagNames: selectedTags.length > 0 ? selectedTags : undefined,
      type: selectedType === "all" ? undefined : selectedType,
    },
    [searchTerm, selectedTags, selectedType]
  );

  const { data: tagsData } = useQuery<{ tags: any[] }>(TAGS_QUERY);

  const deleteEntryMutation = useMutation<{ deleteEntry: boolean }>(
    DELETE_ENTRY_MUTATION
  );

  const handleDeleteEntry = async (id: string) => {
    if (confirm("Are you sure you want to delete this memory?")) {
      try {
        await deleteEntryMutation.execute({ id });
        refetchEntries();
        setSelectedEntry(null);
        toast.success("Memory deleted successfully");
      } catch (error: any) {
        console.error("Failed to delete entry:", error);
        toast.error("Failed to delete memory: " + error.message);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntry(null);
    refetchEntries();
    toast.success(
      editingEntry
        ? "Memory updated successfully"
        : "Memory created successfully"
    );
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleNavigateToEntry = (entryId: string) => {
    const entry = entriesData?.entries.find((e) => e.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
    }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    // Reset filters when changing views
    if (view !== activeView) {
      setSearchTerm("");
      setSelectedType(
        view === "home"
          ? "all"
          : view === "memories"
          ? "all"
          : view === "code"
          ? "CODE_SNIPPET"
          : view === "bookmarks"
          ? "BOOKMARK"
          : "all"
      );
      setSelectedTags([]);
    }
  };

  const getFilteredEntries = () => {
    if (!entriesData?.entries) return [];

    let filtered = entriesData.entries;

    if (activeView === "code") {
      filtered = filtered.filter((entry) => entry.type === "CODE_SNIPPET");
    } else if (activeView === "bookmarks") {
      filtered = filtered.filter((entry) => entry.type === "BOOKMARK");
    } else if (activeView === "memories" && selectedType !== "all") {
      filtered = filtered.filter((entry) => entry.type === selectedType);
    }

    return filtered;
  };

  const getRecentActivity = () => {
    if (!entriesData?.entries) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entriesData.entries.filter(
      (entry) => new Date(entry.updatedAt) > weekAgo
    ).length;
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

  const sidebarProps = {
    activeView,
    onViewChange: handleViewChange,
    onShowSearch: () => setShowSearch(!showSearch),
    onShowForm: () => setShowForm(true),
    onShowExportImport: () => setShowExportImport(true),
  };

  // Export/Import View
  if (showExportImport) {
    return (
      <MainLayout sidebarProps={sidebarProps}>
        <div className="h-full overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <ExportImport onClose={() => setShowExportImport(false)} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Entry Form View
  if (showForm) {
    return (
      <MainLayout sidebarProps={sidebarProps}>
        <div className="h-full overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
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
      </MainLayout>
    );
  }

  // Entry Detail View
  if (selectedEntry) {
    return (
      <MainLayout sidebarProps={sidebarProps}>
        <div className="h-full overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <EntryDetail
              entry={selectedEntry}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onBack={() => setSelectedEntry(null)}
              onNavigateToEntry={handleNavigateToEntry}
              onRefresh={() => {
                refetchEntries();
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
      </MainLayout>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <MainLayout sidebarProps={sidebarProps}>
      <div className="h-full overflow-auto">
        <div className="p-8 space-y-8">
          {/* Welcome Banner */}
          <WelcomeBanner
            userName={user?.name || user?.email?.split("@")[0]}
            totalMemories={entriesData?.entries.length || 0}
            recentActivity={getRecentActivity()}
            onQuickAdd={() => setShowForm(true)}
          />

          {/* Search Bar */}
          {(showSearch || searchTerm || selectedTags.length > 0) && (
            <SearchBar
              onSearch={setSearchTerm}
              onTypeFilter={setSelectedType}
              onTagFilter={setSelectedTags}
              availableTags={tagsData?.tags || []}
            />
          )}

          {/* Memory Grid */}
          <MemoryGrid
            memories={filteredEntries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onSelect={setSelectedEntry}
            onAddNew={() => setShowForm(true)}
            searchQuery={searchTerm}
            selectedType={selectedType}
            title={
              activeView === "home"
                ? "Your Memories"
                : activeView === "code"
                ? "Code Snippets"
                : activeView === "bookmarks"
                ? "Bookmarks"
                : "Your Memories"
            }
          />
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => setShowForm(true)} />
      </div>
    </MainLayout>
  );
}

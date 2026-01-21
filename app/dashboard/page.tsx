"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CollectionList } from "@/components/collections/collection-list";
import { CollectionDetail } from "@/components/collections/collection-detail";
import { AddToCollectionDialog } from "@/components/collections/add-to-collection-dialog";
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
  const searchParams = useSearchParams();
  const viewFromUrl = searchParams?.get('view') || 'home';
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionEntryId, setCollectionEntryId] = useState<string | null>(null);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Redirect to auth if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Reset selections when switching views
  useEffect(() => {
    setSelectedEntry(null);
    setSelectedCollectionId(null);
  }, [viewFromUrl]);

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

  const handleAddToCollection = (id: string) => {
    setCollectionEntryId(id);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedTags([]);
  };

  const getFilteredEntries = () => {
    if (!entriesData?.entries) return [];

    let filtered = entriesData.entries;

    // Filter is already applied by the GraphQL query based on selectedType
    // No additional filtering needed here

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

  // Collections View
  if (viewFromUrl === "collections") {
    if (selectedCollectionId) {
      return (
        <MainLayout sidebarProps={sidebarProps}>
          <div className="h-full overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              <CollectionDetail
                collectionId={selectedCollectionId}
                onBack={() => setSelectedCollectionId(null)}
                onEditEntry={handleEditEntry}
                onNavigateToEntry={(id) => {
                  handleNavigateToEntry(id);
                  // We stay in collections view but might want to see details
                }}
              />
            </div>
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout sidebarProps={sidebarProps}>
        <div className="h-full overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <CollectionList onSelectCollection={setSelectedCollectionId} />
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
              viewFromUrl === "home"
                ? "Your Memories"
                : viewFromUrl === "collections"
                ? "Collections"
                : "Your Memories"
            }
            onAddToCollection={handleAddToCollection}
          />
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => setShowForm(true)} />

        <AddToCollectionDialog 
          entryId={collectionEntryId} 
          onOpenChange={(open) => !open && setCollectionEntryId(null)} 
        />
      </div>
    </MainLayout>
  );
}

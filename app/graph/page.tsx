"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useQuery } from "@/lib/graphql/client";
import { MainLayout } from "@/components/layout/main-layout";
import { KnowledgeGraph } from "@/components/visualization/knowledge-graph";
import { SampleDataLoader } from "@/components/sample-data-loader";
import { GraphSkeleton } from "@/components/ui/graph-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network } from "lucide-react";

const ENTRIES_WITH_RELATIONS_QUERY = `
  query EntriesWithRelations {
    entries {
      id
      title
      content
      type
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

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to auth if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const {
    data: entriesData,
    loading: entriesLoading,
    error,
    refetch: refetchEntries,
  } = useQuery<{
    entries: any[];
  }>(ENTRIES_WITH_RELATIONS_QUERY);

  if (loading || entriesLoading) {
    return (
      <MainLayout showSidebar={false}>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">
                  Loading knowledge graph...
                </span>
              </div>
            </div>
          </div>

          <GraphSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout showSidebar={false}>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Failed to load knowledge graph: {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                size="sm"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const entries = entriesData?.entries || [];

  return (
    <MainLayout showSidebar={false}>
      <div className="h-screen overflow-auto">
        <div className="w-full px-4 py-8 space-y-6 min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Network className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Knowledge Graph</h1>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Interactive Knowledge Visualization
                </CardTitle>
                <CardDescription>
                  Explore your knowledge entries as an interactive graph. Nodes
                  represent entries, and edges show relationships between them.
                  You can zoom, pan, and drag nodes to explore connections.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Graph */}
          <div className="space-y-4 max-w-7xl mx-auto">
            {entries.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                      <Network className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium">
                          No Knowledge Entries
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Create some entries and relationships to see them
                          visualized here.
                        </p>
                        <Button
                          onClick={() => router.push("/dashboard")}
                          className="mt-4"
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <SampleDataLoader onDataCreated={() => refetchEntries()} />
              </div>
            ) : (
              <>
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">
                        {entries.length}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Entries
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-500">
                        {entries.reduce(
                          (acc, entry) => acc + entry.fromRelations.length,
                          0
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Relationships
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-500">
                        {
                          entries.filter((e) => e.type === "CODE_SNIPPET")
                            .length
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Code Snippets
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-500">
                        {entries.filter((e) => e.type === "ARTICLE").length}
                      </div>
                      <p className="text-sm text-muted-foreground">Articles</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Graph */}
                <div className="w-full">
                  <KnowledgeGraph entries={entries} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

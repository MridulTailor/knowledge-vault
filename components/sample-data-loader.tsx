"use client";

import { useState } from "react";
import { useMutation } from "@/lib/graphql/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Database } from "lucide-react";

const CREATE_ENTRY_MUTATION = `
  mutation CreateEntry($input: CreateEntryInput!) {
    createEntry(input: $input) {
      id
      title
      content
      type
    }
  }
`;

const CREATE_RELATIONSHIP_MUTATION = `
  mutation CreateRelationship($input: CreateRelationshipInput!) {
    createRelationship(input: $input) {
      id
      type
      description
    }
  }
`;

const sampleData = [
  {
    title: "React Hooks Fundamentals",
    content:
      "Understanding useState, useEffect, and custom hooks. The foundation of modern React development with functional components.",
    type: "ARTICLE",
    tagNames: ["React", "JavaScript", "Frontend"],
  },
  {
    title: "Custom Hook for API Calls",
    content: `function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading, error };
}`,
    type: "CODE_SNIPPET",
    language: "javascript",
    tagNames: ["React", "JavaScript", "API", "Custom Hooks"],
  },
  {
    title: "TypeScript Best Practices",
    content:
      "Learn advanced TypeScript patterns, generics, utility types, and how to leverage the type system for better code quality and developer experience.",
    type: "ARTICLE",
    tagNames: ["TypeScript", "Best Practices", "Development"],
  },
  {
    title: "D3.js Force Simulation",
    content:
      "Interactive data visualization with D3.js force simulations. Learn how to create dynamic, physics-based layouts for network graphs and node-link diagrams.",
    type: "ARTICLE",
    tagNames: ["D3.js", "Data Visualization", "JavaScript", "Interactive"],
  },
  {
    title: "Graph Visualization Component",
    content: `interface GraphNode {
  id: string;
  title: string;
  type: string;
  x?: number;
  y?: number;
}

function KnowledgeGraph({ nodes, links }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }, [nodes, links]);
}`,
    type: "CODE_SNIPPET",
    language: "typescript",
    tagNames: ["D3.js", "React", "TypeScript", "Graph", "Visualization"],
  },
  {
    title: "Next.js Documentation",
    content:
      "Official Next.js documentation with comprehensive guides, API reference, and examples for building full-stack React applications.",
    type: "BOOKMARK",
    url: "https://nextjs.org/docs",
    tagNames: ["Next.js", "React", "Documentation", "Full-Stack"],
  },
];

const relationships = [
  {
    from: 0,
    to: 1,
    type: "SOURCE_FOR",
    description: "Custom hook builds upon React Hooks fundamentals",
  },
  {
    from: 0,
    to: 2,
    type: "RELATED_TO",
    description: "Both are about modern development practices",
  },
  {
    from: 3,
    to: 4,
    type: "SOURCE_FOR",
    description: "D3 concepts applied in graph component",
  },
  {
    from: 4,
    to: 1,
    type: "INSPIRED_BY",
    description: "Graph component inspired by custom hook patterns",
  },
  {
    from: 5,
    to: 0,
    type: "REFERENCES",
    description: "Next.js docs reference React fundamentals",
  },
  {
    from: 2,
    to: 4,
    type: "BUILDS_ON",
    description: "TypeScript enhances graph component development",
  },
];

interface SampleDataLoaderProps {
  onDataCreated: () => void;
}

export function SampleDataLoader({ onDataCreated }: SampleDataLoaderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createEntryMutation = useMutation(CREATE_ENTRY_MUTATION);
  const createRelationshipMutation = useMutation(CREATE_RELATIONSHIP_MUTATION);

  const createSampleData = async () => {
    setIsCreating(true);
    try {
      toast.info("Creating sample data...", { duration: 1000 });

      // Create entries
      const createdEntries: any[] = [];
      for (const entryData of sampleData) {
        const result = (await createEntryMutation.execute({
          input: entryData,
        })) as any;
        createdEntries.push(result.createEntry);
        await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay to avoid overwhelming the API
      }

      // Create relationships
      for (const rel of relationships) {
        if (createdEntries[rel.from] && createdEntries[rel.to]) {
          await createRelationshipMutation.execute({
            input: {
              fromEntryId: createdEntries[rel.from].id,
              toEntryId: createdEntries[rel.to].id,
              type: rel.type,
              description: rel.description,
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      toast.success("Sample data created successfully!");
      onDataCreated();
    } catch (error: any) {
      console.error("Failed to create sample data:", error);
      toast.error("Failed to create sample data: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Sample Data Loader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No entries found. Create sample data to see the knowledge graph in
          action with connected nodes and relationships.
        </p>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sample data includes:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• 6 diverse entries (articles, code snippets, bookmarks)</li>
            <li>• Various tags and content types</li>
            <li>• 6 interconnected relationships</li>
            <li>• Real-world development topics</li>
          </ul>
        </div>
        <Button
          onClick={createSampleData}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating Sample Data...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Sample Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

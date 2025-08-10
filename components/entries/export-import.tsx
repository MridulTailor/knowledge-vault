"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileJson, FileText } from "lucide-react";
import { useQuery } from "@/lib/graphql/client";

const ALL_ENTRIES_QUERY = `
  query AllEntries {
    entries {
      id
      title
      content
      type
      language
      url
      metadata
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

interface ExportImportProps {
  onClose: () => void;
}

export function ExportImport({ onClose }: ExportImportProps) {
  const { data: entriesData, loading } = useQuery<{ entries: any[] }>(
    ALL_ENTRIES_QUERY
  );

  const exportAsJSON = () => {
    if (!entriesData?.entries) return;

    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      entries: entriesData.entries,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge-vault-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    if (!entriesData?.entries) return;

    let markdown = `# Knowledge Vault Export\n\n`;
    markdown += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

    entriesData.entries.forEach((entry: any) => {
      markdown += `## ${entry.title}\n\n`;
      markdown += `**Type:** ${entry.type}\n\n`;

      if (entry.tags.length > 0) {
        markdown += `**Tags:** ${entry.tags
          .map((t: any) => t.name)
          .join(", ")}\n\n`;
      }

      if (entry.url) {
        markdown += `**URL:** ${entry.url}\n\n`;
      }

      if (entry.language) {
        markdown += `**Language:** ${entry.language}\n\n`;
      }

      markdown += `${entry.content}\n\n`;

      if (entry.fromRelations.length > 0 || entry.toRelations.length > 0) {
        markdown += `**Relationships:**\n`;
        entry.fromRelations.forEach((rel: any) => {
          markdown += `- ${rel.type}: → ${rel.toEntry.title}\n`;
        });
        entry.toRelations.forEach((rel: any) => {
          markdown += `- ${rel.type}: ← ${rel.fromEntry.title}\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge-vault-export-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onClose}>
          ← Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all your entries and relationships. Choose your preferred
            format below.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileJson className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium">JSON Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete data with full structure
                  </p>
                </div>
              </div>
              <Button
                onClick={exportAsJSON}
                disabled={loading}
                className="w-full"
              >
                Export as JSON
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Markdown Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Human-readable format
                  </p>
                </div>
              </div>
              <Button
                onClick={exportAsMarkdown}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Export as Markdown
              </Button>
            </Card>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground text-center">
              Loading entries for export...
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Import Feature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import functionality coming soon! For now, you can manually create
              entries.
            </p>
            <Button variant="outline" disabled>
              Import JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

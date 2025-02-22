
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function Index() {
  const [allBookmarks] = useState(new Set<string>());
  const [folderStructure, setFolderStructure] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.html')) {
        toast({
          title: "Invalid file type",
          description: "Please only upload HTML files",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => parseBookmarks(e.target?.result as string);
      reader.readAsText(file);
    });
  };

  const parseBookmarks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');
    const newFolderStructure = { ...folderStructure };
    
    links.forEach(link => {
      const url = link.getAttribute('href');
      const title = link.textContent;
      
      if (url && title && !allBookmarks.has(url)) {
        allBookmarks.add(url);
        if (!newFolderStructure[title]) {
          newFolderStructure[title] = [];
        }
        newFolderStructure[title].push(url);
      }
    });
    
    setFolderStructure(newFolderStructure);
    toast({
      title: "Success",
      description: "Bookmarks parsed successfully",
    });
  };

  const mergeBookmarks = () => {
    let mergedContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Merged Bookmarks</H1>
<DL><p>`;

    for (const [title, urls] of Object.entries(folderStructure)) {
      mergedContent += `    <DT><H3>${title}</H3>\n    <DL><p>\n`;
      urls.forEach(url => {
        mergedContent += `        <DT><A HREF="${url}">${title}</A>\n`;
      });
      mergedContent += '    </DL><p>\n';
    }

    mergedContent += '</DL></p>';

    const blob = new Blob([mergedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-bookmarks.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Bookmarks merged and downloaded successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Bookmark Merger</h1>
          <p className="text-muted-foreground">
            Merge your Chrome bookmarks easily by dragging and dropping your bookmark HTML files
          </p>
        </div>

        <div
          className="border-2 border-dashed rounded-lg p-12 text-center space-y-4"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-accent');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-accent');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-accent');
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="text-2xl font-semibold">
            Drag & Drop Chrome Bookmark HTML Files Here
          </div>
          <p className="text-sm text-muted-foreground">
            or
          </p>
          <input
            type="file"
            id="file-input"
            className="hidden"
            multiple
            accept=".html"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Select Files
          </Button>
        </div>

        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                disabled={Object.keys(folderStructure).length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Merge & Download
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Merge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Are you sure you want to merge {Object.keys(folderStructure).length} bookmark folders?</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={mergeBookmarks}>
                    Merge & Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(folderStructure).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Parsed Bookmarks</h2>
            <div className="space-y-2">
              {Object.entries(folderStructure).map(([title, urls]) => (
                <div key={title} className="border rounded-lg p-4">
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{urls.length} bookmarks</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

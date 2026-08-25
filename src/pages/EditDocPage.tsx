import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router';
import { Sparkles, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export const EditDocPage: React.FC = () => {
  const { currentProject } = useOutletContext<{ currentProject: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSlug = searchParams.get('doc');

  const [category, setCategory] = useState('Architecture');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editSlug) {
      fetch(`/api/projects/${currentProject}/docs/${editSlug}`)
        .then(res => res.json())
        .then(data => {
          const doc = data.doc || data;
          if (doc && doc.title) {
            setTitle(doc.title);
            setContent(doc.content || '');
            setCategory(doc.category || 'Architecture');
            setIsEditingExisting(true);
          }
        })
        .catch(err => console.error("Failed to load doc for edit:", err));
    }
  }, [currentProject, editSlug]);

  const handleAiEnhance = async (useThinking: boolean) => {
    setIsAiLoading(true);
    try {
      const prompt = `Please format and enhance this software documentation using clean Markdown. Make it professional, clear, with code snippets where appropriate.\n\nCategory: ${category}\nTitle: ${title}\n\nContent:\n${content}`;
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useThinking })
      });
      const data = await res.json();
      if (data.text) {
        let cleanText = data.text;
        if (cleanText.startsWith('```markdown')) {
          cleanText = cleanText.replace(/```markdown\n?/g, '').replace(/```\n?$/g, '');
        }
        setContent(cleanText.trim());
      } else if (data.error) {
        alert(`AI note: ${data.error}`);
      }
    } catch (err: any) {
      console.error("AI enhancement failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !category.trim()) {
      alert("Please provide a title and category for the document.");
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditingExisting && editSlug
        ? `/api/projects/${currentProject}/docs/${editSlug}`
        : `/api/projects/${currentProject}/docs`;
      const method = isEditingExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, content, lastEditedBy: "Developer" })
      });
      const data = await res.json();
      const savedDoc = data.doc || data;
      const targetSlug = savedDoc?.slug || editSlug || title.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      navigate(`/${currentProject}/docs?doc=${targetSlug}`);
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background text-foreground h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/${currentProject}/docs`)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEditingExisting ? `Edit Document: ${title || editSlug}` : 'Create New Document'}
            </h1>
            <p className="text-xs text-muted-foreground">Project: {currentProject}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAiEnhance(false)}
            disabled={isAiLoading || !content}
            className="text-indigo-500 hover:text-indigo-600 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs h-8"
          >
            {isAiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            AI Polish
          </Button>

          <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs h-8">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save to Hub
          </Button>
        </div>
      </div>

      {/* Editor Form */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="sm:col-span-1">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="Architecture">Architecture</option>
              <option value="Backend">Backend</option>
              <option value="Frontend">Frontend</option>
              <option value="Dashboard">Dashboard</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              placeholder="Document Title (e.g. Authentication Architecture)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-semibold h-9"
            />
          </div>
        </div>

        <Textarea
          placeholder="# Write your documentation here in Markdown..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 font-mono text-xs resize-none p-4 rounded-xl border border-border bg-card leading-relaxed"
        />
      </div>
    </div>
  );
};

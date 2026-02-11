"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Save,
  AlertTriangle,
  Key,
  Lock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: ("production" | "preview" | "development")[];
  encrypted: boolean;
}

interface EnvVariablesProps {
  projectId: string;
  initialVariables?: EnvVariable[];
  onSave?: (variables: EnvVariable[]) => void;
}

const defaultVariables: EnvVariable[] = [
  {
    id: "env-1",
    key: "DATABASE_URL",
    value: "postgresql://user:pass@localhost:5432/db",
    target: ["production", "preview", "development"],
    encrypted: true,
  },
  {
    id: "env-2",
    key: "API_KEY",
    value: "sk-1234567890abcdef",
    target: ["production"],
    encrypted: true,
  },
  {
    id: "env-3",
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://myapp.cloudify.app",
    target: ["production", "preview"],
    encrypted: false,
  },
];

export function EnvVariables({ projectId, initialVariables, onSave }: EnvVariablesProps) {
  const [variables, setVariables] = useState<EnvVariable[]>(
    initialVariables || defaultVariables
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState({ key: "", value: "" });
  const [hasChanges, setHasChanges] = useState(false);

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addVariable = () => {
    if (!newVar.key || !newVar.value) return;

    const newVariable: EnvVariable = {
      id: `env-${Date.now()}`,
      key: newVar.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      value: newVar.value,
      target: ["production", "preview", "development"],
      encrypted: !newVar.key.startsWith("NEXT_PUBLIC_"),
    };

    setVariables([...variables, newVariable]);
    setNewVar({ key: "", value: "" });
    setIsAdding(false);
    setHasChanges(true);
  };

  const deleteVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
    setHasChanges(true);
  };

  const updateVariable = (id: string, updates: Partial<EnvVariable>) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    setHasChanges(true);
  };

  const toggleTarget = (id: string, target: "production" | "preview" | "development") => {
    const variable = variables.find((v) => v.id === id);
    if (!variable) return;

    const newTargets = variable.target.includes(target)
      ? variable.target.filter((t) => t !== target)
      : [...variable.target, target];

    updateVariable(id, { target: newTargets });
  };

  const handleSave = () => {
    onSave?.(variables);
    setHasChanges(false);
  };

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Environment Variables
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure environment variables for your deployments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="default" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
            Add Variable
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-lg bg-secondary border border-border flex items-start gap-3">
        <Info className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          <p className="font-medium">Environment Variable Tips</p>
          <ul className="mt-1 list-disc list-inside space-y-1 text-foreground">
            <li>Variables starting with NEXT_PUBLIC_ are exposed to the browser</li>
            <li>Sensitive values are encrypted at rest</li>
            <li>Changes require a new deployment to take effect</li>
          </ul>
        </div>
      </div>

      {/* Add new variable form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg border border-border bg-secondary"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Key
                </label>
                <Input
                  placeholder="VARIABLE_NAME"
                  value={newVar.key}
                  onChange={(e) => setNewVar({ ...newVar, key: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Value
                </label>
                <Input
                  placeholder="value"
                  value={newVar.value}
                  onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={addVariable}>
                Add Variable
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variables list */}
      <div className="space-y-3">
        {variables.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No environment variables configured
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add Variable
            </Button>
          </div>
        ) : (
          variables.map((variable) => (
            <motion.div
              key={variable.id}
              layout
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-medium text-foreground">
                      {variable.key}
                    </span>
                    {variable.encrypted && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </TooltipTrigger>
                        <TooltipContent>Encrypted at rest</TooltipContent>
                      </Tooltip>
                    )}
                    {variable.key.startsWith("NEXT_PUBLIC_") && (
                      <Badge variant="warning" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm text-muted-foreground bg-background rounded px-3 py-2 overflow-hidden">
                      {showValues[variable.id] ? (
                        variable.value
                      ) : (
                        <span className="select-none">
                          {"•".repeat(Math.min(variable.value.length, 30))}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleShowValue(variable.id)}
                    >
                      {showValues[variable.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyValue(variable.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => deleteVariable(variable.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Target environments */}
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground mb-2 block">
                  Apply to environments:
                </span>
                <div className="flex items-center gap-4">
                  {(["production", "preview", "development"] as const).map((target) => (
                    <label
                      key={target}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Switch
                        checked={variable.target.includes(target)}
                        onCheckedChange={() => toggleTarget(variable.id, target)}
                      />
                      <span className="text-sm capitalize text-foreground">
                        {target}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

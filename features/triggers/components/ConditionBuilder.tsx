'use client'

import * as React from 'react'
import { Plus, Trash2, GitBranch, Key, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { getEventFields } from '@/lib/eventRegistry'
import type { EventType } from '@/constants/eventTypes'
import { OPERATORS, getOperatorByValue } from '@/constants/operators'
import type { ConditionGroup, ConditionRule, Operator } from '@/types/trigger'
import { cn } from '@/lib/utils'

interface ConditionBuilderProps {
  value: ConditionGroup
  onChange: (value: ConditionGroup) => void
  eventType: EventType
}

export function ConditionBuilder({ value, onChange, eventType }: ConditionBuilderProps) {
  const fields = React.useMemo(() => getEventFields(eventType), [eventType])
  
  // Keep track of open popovers for each rule selector (key: string like '0-1' representing rule path)
  const [openSelectors, setOpenSelectors] = React.useState<Record<string, boolean>>({})

  // Helper to update a path in the condition tree
  const updateTree = (
    currentGroup: ConditionGroup,
    path: number[],
    updateFn: (item: any) => any
  ): ConditionGroup => {
    if (path.length === 0) {
      return updateFn(currentGroup)
    }

    const [index, ...rest] = path
    const updatedRules = [...currentGroup.rules]
    updatedRules[index!] = updateTree(updatedRules[index!] as ConditionGroup, rest, updateFn)

    return {
      ...currentGroup,
      rules: updatedRules,
    }
  }

  const handleAddRule = (path: number[]) => {
    const defaultField = fields[0]?.name ?? ''
    const newRule: ConditionRule = {
      field: defaultField,
      op: 'eq',
      value: '',
    }

    const next = updateTree(value, path, (group) => ({
      ...group,
      rules: [...group.rules, newRule],
    }))
    onChange(next)
  }

  const handleAddGroup = (path: number[]) => {
    const newGroup: ConditionGroup = {
      operator: 'AND',
      rules: [],
    }

    const next = updateTree(value, path, (group) => ({
      ...group,
      rules: [...group.rules, newGroup],
    }))
    onChange(next)
  }

  const handleRemoveItem = (path: number[], indexToRemove: number) => {
    const next = updateTree(value, path, (group) => ({
      ...group,
      rules: group.rules.filter((_: any, idx: number) => idx !== indexToRemove),
    }))
    onChange(next)
  }

  const handleUpdateRule = (path: number[], index: number, updatedRule: Partial<ConditionRule>) => {
    const next = updateTree(value, path, (group) => {
      const rules = [...group.rules]
      rules[index] = { ...rules[index] as ConditionRule, ...updatedRule }
      return { ...group, rules }
    })
    onChange(next)
  }

  const handleUpdateGroupOperator = (path: number[], operator: 'AND' | 'OR') => {
    const next = updateTree(value, path, (group) => ({
      ...group,
      operator,
    }))
    onChange(next)
  }

  // Recursive renderer for condition groups
  const renderGroup = (group: ConditionGroup, path: number[] = []): React.ReactNode => {
    const isRoot = path.length === 0

    return (
      <div
        className={cn(
          "relative space-y-4 rounded-xl border border-dashed border-border p-4 transition-all",
          isRoot ? 'bg-card/30 border-border/80' : 'bg-muted/10 ml-4 md:ml-6'
        )}
      >
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isRoot && <GitBranch className="size-4 text-muted-foreground" />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isRoot ? 'Global Rules Group' : 'Sub-Group'}
            </span>
            <Select
              value={group.operator}
              onValueChange={(val: 'AND' | 'OR') => handleUpdateGroupOperator(path, val)}
            >
              <SelectTrigger className="h-7 w-[80px] text-xs font-bold bg-card" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND" className="text-xs">AND</SelectItem>
                <SelectItem value="OR" className="text-xs">OR</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground font-medium">
              {group.operator === 'AND' ? '(All rules must pass)' : '(Any rule must pass)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 text-[10px] gap-1 cursor-pointer font-medium bg-card"
              onClick={() => handleAddRule(path)}
            >
              <Plus className="size-3" />
              Add Rule
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 text-[10px] gap-1 cursor-pointer font-medium bg-card"
              onClick={() => handleAddGroup(path)}
            >
              <GitBranch className="size-3" />
              Add Group
            </Button>
          </div>
        </div>

        {/* Child items */}
        {group.rules.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground italic bg-muted/5 rounded-lg border border-dashed border-border/40">
            No active conditions in this group. Add a rule to start filtering.
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Draw a subtle indicator line for nested groups */}
            {!isRoot && (
              <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-border/40 ml-[-2px]" />
            )}
            {group.rules.map((rule, idx) => {
              const currentPath = [...path, idx]
              const isSubGroup = 'operator' in rule
              const ruleKey = currentPath.join('-')

              if (isSubGroup) {
                return (
                  <div key={idx} className="relative group">
                    {renderGroup(rule as ConditionGroup, currentPath)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-2 size-7 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => handleRemoveItem(path, idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
              }

              return (
                <div key={idx}>
                  {renderRule(rule as ConditionRule, currentPath, idx, ruleKey, () =>
                    handleRemoveItem(path, idx)
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render individual rule row
  const renderRule = (
    rule: ConditionRule,
    path: number[],
    index: number,
    ruleKey: string,
    onDelete: () => void
  ): React.ReactNode => {
    const selectedField = fields.find((f) => f.name === rule.field)
    const operatorInfo = getOperatorByValue(rule.op)
    const inputType = operatorInfo?.inputType ?? 'text'
    const popoverOpen = !!openSelectors[ruleKey]

    const setPopoverOpen = (open: boolean) => {
      setOpenSelectors((prev) => ({ ...prev, [ruleKey]: open }))
    }

    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/45 bg-card/65 p-2.5 shadow-2xs">
        {/* Searchable Autocomplete Field Selector */}
        <div className="flex-1 min-w-[180px]">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between h-8 text-xs font-mono bg-card border-border/80 shadow-none text-left"
              >
                {rule.field ? (
                  <span className="truncate">
                    {rule.field}{' '}
                    <span className="text-[9px] text-muted-foreground font-sans font-normal opacity-70">
                      ({selectedField?.type || 'string'})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select property...</span>
                )}
                <ChevronDown className="size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search property..." className="h-8" />
                <CommandList>
                  <CommandEmpty>No properties match.</CommandEmpty>
                  <CommandGroup heading="Event Schema properties">
                    {fields.map((f) => (
                      <CommandItem
                        key={f.name}
                        value={f.name}
                        onSelect={() => {
                          const targetField = fields.find((item) => item.name === f.name)
                          handleUpdateRule(path.slice(0, -1), index, {
                            field: f.name,
                            op: 'eq',
                            value: targetField?.type === 'boolean' ? 'true' : '',
                          })
                          setPopoverOpen(false)
                        }}
                        className="font-mono text-xs cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {rule.field === f.name && <Check className="size-3.5 text-indigo-600 dark:text-indigo-400" />}
                          <span>{f.name}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-sans bg-muted/40 px-1 py-0.5 rounded border border-border/10 shrink-0">
                          {f.type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Operator Selector */}
        <div className="w-[145px] shrink-0">
          <Select
            value={rule.op}
            onValueChange={(op) => {
              const targetOp = getOperatorByValue(op)
              let defaultValue: string | number | boolean = ''
              if (targetOp?.inputType === 'boolean') {
                defaultValue = 'true'
              } else if (targetOp?.inputType === 'none') {
                defaultValue = 'true'
              }
              handleUpdateRule(path.slice(0, -1), index, { op: op as Operator, value: defaultValue })
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-border/80" size="sm">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value} className="text-xs">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className="flex-[2] min-w-[200px]">
          {inputType === 'text' && (
            <Input
              type="text"
              className="h-8 text-xs bg-card border-border/80"
              value={String(rule.value ?? '')}
              onChange={(e) => handleUpdateRule(path.slice(0, -1), index, { value: e.target.value })}
              placeholder="Comparison value..."
            />
          )}

          {inputType === 'number' && (
            <Input
              type="number"
              className="h-8 text-xs bg-card border-border/80"
              value={String(rule.value ?? '')}
              onChange={(e) =>
                handleUpdateRule(path.slice(0, -1), index, {
                  value: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              placeholder="0"
            />
          )}

          {inputType === 'boolean' && (
            <div className="flex h-8 items-center gap-2 px-2 border border-border/80 bg-card rounded-md">
              <span className="text-[11px] text-muted-foreground font-mono">
                {String(rule.value) === 'true' ? 'True' : 'False'}
              </span>
              <Switch
                checked={String(rule.value) === 'true'}
                onCheckedChange={(checked) =>
                  handleUpdateRule(path.slice(0, -1), index, { value: checked ? 'true' : 'false' })
                }
              />
            </div>
          )}

          {inputType === 'none' && (
            <div className="h-8 flex items-center px-2 text-xs text-muted-foreground italic bg-muted/35 rounded border border-border/40">
              No parameter value required
            </div>
          )}
        </div>

        {/* Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 text-muted-foreground hover:text-destructive transition-colors shrink-0 cursor-pointer"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <Label className="text-xs font-semibold text-foreground">Rule Filter Hierarchy</Label>
        <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
          Evaluated against the incoming <code className="rounded bg-muted/80 border border-border/30 px-1 py-0.2 font-mono text-[9px]">{eventType || '[unselected]'}</code> payload keys
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 bg-muted/5">
          Select an event type first to view payload property filtering options.
        </div>
      ) : (
        renderGroup(value)
      )}
    </div>
  )
}

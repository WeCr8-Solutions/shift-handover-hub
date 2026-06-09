import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { useCustomers, type Customer, type CustomerInput } from "@/hooks/useCustomers";
import { useOrgContext } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Search, Loader2, Users } from "lucide-react";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { CustomerRowExpand } from "@/components/customers/CustomerRowExpand";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const { organization, organizationRole } = useOrgContext();
  const { customers, loading, createCustomer, updateCustomer, deactivateCustomer } = useCustomers();
  const { toast } = useToast();

  const canEdit = organizationRole === "owner" || organizationRole === "admin";
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (input: CustomerInput) => {
    if (editing) {
      return updateCustomer(editing.id, input);
    }
    return createCustomer(input);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await deactivateCustomer(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    toast(
      error
        ? { title: "Remove failed", description: error, variant: "destructive" }
        : { title: "Customer archived" },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" /> Customers
            </h1>
            <p className="text-sm text-muted-foreground">
              Central directory for {organization?.name}. Linked to part catalog and work orders.
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              data-testid="customers-add"
            >
              <Plus className="w-4 h-4 mr-2" /> Add customer
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All customers</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${filtered.length} of ${customers.length} shown`}
            </CardDescription>
            <div className="relative max-w-sm mt-2">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, contact, email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                {customers.length === 0
                  ? "No customers yet. Add one to start linking parts and work orders."
                  : "No customers match your search."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const open = expanded.has(c.id);
                    return (
                      <>
                        <TableRow key={c.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleExpand(c.id)}
                              aria-label={open ? "Collapse" : "Expand"}
                            >
                              {open ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm">{c.contact_name || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.contact_email || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.contact_phone || "—"}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditing(c);
                                  setDialogOpen(true);
                                }}
                                aria-label={`Edit ${c.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setToDelete(c)}
                                aria-label={`Archive ${c.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                        {open && organization?.id && (
                          <TableRow key={`${c.id}-expand`}>
                            <TableCell colSpan={canEdit ? 6 : 5} className="bg-muted/30">
                              <CustomerRowExpand customerId={c.id} organizationId={organization.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive customer?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.name}</strong> will be hidden from autocomplete but existing work orders and parts
              keep their reference. You can restore by editing and re-activating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

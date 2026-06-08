import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { NumCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useCredits } from "@/features/credit/hooks";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const { data: credits, isLoading } = useCredits();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return credits ?? [];
    return (credits ?? []).filter(
      (c) =>
        c.product_title.toLowerCase().includes(q) ||
        c.buyer_name?.toLowerCase().includes(q),
    );
  }, [credits, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Credits" subtitle="Sharia-credit sales & their schedules." />

      <div className="flex justify-end">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search product or buyer…"
          className="sm:w-72"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Product</TH>
            <TH>Buyer</TH>
            <TH align="right">Total</TH>
            <TH align="right">Outstanding</TH>
            <TH align="center">Tenor</TH>
            <TH>Status</TH>
            <TH align="right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {isLoading ? (
            <SkeletonRows rows={6} cols={7} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={CreditCard}
                  title={query ? "No matching credits" : "No credit sales yet"}
                  hint={query ? "Try a different search." : "Credit sales appear here automatically."}
                />
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.product_title}</TD>
                <TD className="text-muted-foreground">{c.buyer_name || "—"}</TD>
                <NumCell className="text-muted-foreground">{formatIDR(c.total_price)}</NumCell>
                <NumCell className="font-medium">{formatIDR(c.outstanding)}</NumCell>
                <TD className="text-center text-muted-foreground">{c.tenor_months} mo</TD>
                <TD>
                  <Badge
                    value={c.is_settled ? "settled" : "active"}
                    label={c.is_settled ? "Settled" : "Active"}
                  />
                </TD>
                <TD>
                  <div className="flex justify-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/credits/$id" params={{ id: c.id }}>
                        Schedule <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

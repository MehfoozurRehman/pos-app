import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';

const kpis = [
  { label: 'Revenue (30d)', value: 'Rs. 1,245,300' },
  { label: 'Orders (30d)', value: '482' },
  { label: 'Avg. Order Value', value: 'Rs. 2,583' },
  { label: 'Returning Customers', value: '36%' },
];

export default function Analytics() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartAreaInteractive />
    </div>
  );
}

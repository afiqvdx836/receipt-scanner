import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReceiptData } from '@/app/actions/scan'

export default function ReceiptTable({ data }: { data: ReceiptData }) {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{data.storeName || 'Receipt'}</CardTitle>
                    <Badge variant="outline">{data.date}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Items Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.map((item, i) => (
                            <TableRow key={i}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-center">{item.qty}</TableCell>
                                <TableCell className="text-right">
                                    RM {item.price.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Totals */}
                <div className="border-t pt-4 space-y-1 text-sm">
                    {data.subtotal > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>RM {data.subtotal.toFixed(2)}</span>
                        </div>
                    )}
                    {data.tax > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax</span>
                            <span>RM {data.tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                        <span>Total</span>
                        <span>RM {data.total.toFixed(2)}</span>
                    </div>
                    {data.paymentMethod && (
                        <div className="flex justify-between text-muted-foreground pt-1">
                            <span>Payment</span>
                            <span>{data.paymentMethod}</span>
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    )
}
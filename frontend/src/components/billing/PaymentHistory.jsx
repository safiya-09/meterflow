import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export default function PaymentHistory({ history }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your recent invoices and payments.</CardDescription>
            </CardHeader>
            <CardContent>
                {history?.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No payment history found.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history?.map((payment) => (
                                <TableRow key={payment._id}>
                                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{payment.amount}</TableCell>
                                    <TableCell className="capitalize">{payment.provider}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {payment.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

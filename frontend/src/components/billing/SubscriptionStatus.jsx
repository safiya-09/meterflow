import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from 'lucide-react';

export default function SubscriptionStatus({ subscription, user }) {
    if (!subscription && user.plan === 'free') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>You are using the free version of MeterFlow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary rounded-lg">
                            <span className="font-bold text-xl uppercase text-primary">{user.plan}</span>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Limited to 100 requests / hour</p>
                            <p className="text-sm text-muted-foreground italic">Upgrade for higher limits and priority support.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
               <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Active Subscription</CardTitle>
                    <CardDescription>Managed via {subscription?.provider}</CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {subscription?.status || 'active'}
                  </span>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <p className="text-2xl font-bold uppercase">{user.plan}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Renewal Date</p>
                        <p className="text-2xl font-bold">
                            {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'Monthly'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

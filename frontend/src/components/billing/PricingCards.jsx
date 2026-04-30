import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        description: 'For hobbyists and testing',
        features: ['100 requests/hour', 'Basic dashboard', 'Community support'],
        buttonText: 'Current Plan',
        current: true,
        disabled: true
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹499',
        description: 'Perfect for small projects',
        features: ['1000 requests/hour', 'Priority support', 'Basic analytics'],
        buttonText: 'Upgrade to Pro',
        current: false
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '₹1499',
        description: 'Scaling production apps',
        features: ['10000 requests/hour', 'Advanced analytics', 'Custom limits'],
        buttonText: 'Upgrade to Growth',
        current: false
    }
];

export default function PricingCards({ onSelectPlan, currentPlan }) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
                <Card key={plan.id} className={currentPlan === plan.id ? 'border-primary shadow-md' : ''}>
                    <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <span className="text-4xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-2">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-primary" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Button 
                            className="w-full" 
                            variant={currentPlan === plan.id ? 'outline' : 'default'}
                            disabled={plan.id === 'free' || currentPlan === plan.id}
                            onClick={() => onSelectPlan(plan.id)}
                        >
                            {currentPlan === plan.id ? 'Current Plan' : plan.buttonText}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

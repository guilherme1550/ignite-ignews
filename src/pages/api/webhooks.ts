import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "node:stream/consumers";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import saveSubscription from "./_lib/manageSubscription";

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET

// Posso utilizar esta funcão, ou importar direto o buffer
// async function buffer(readable: Readable) {
//   const chunks = [];

//   for await (const chunk of readable) {
//     chunks.push(
//       typeof chunk === 'string' ? Buffer.from(chunk) : chunk
//     );
//   }

//   return Buffer.concat(chunks);
// }


export const config = {
  api: {
    bodyParser: false,
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export async function webHook(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret) 
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type } = event;
    
    try {
      if (relevantEvents.has(type)) {
        switch (type) {
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription
            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            )
            break
          case 'checkout.session.completed':
            const checkoutSession = event.data.object as Stripe.Checkout.Session;  
            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            )
            break;
          default:
            throw new Error('Unhandled event.')
        }
      }
    } catch (err) {
      return res.json({ error: 'Webhoook handler failed.' })
    }

  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')
  }
  
  
  res.json({ ok: true });
}

export default webHook;
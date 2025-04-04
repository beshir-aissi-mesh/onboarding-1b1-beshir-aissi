# Shop ICY

Shop ICY is a modern e-commerce platform that enables users to purchase products using cryptocurrency through integration with Coinbase Wallet. The application features user authentication, product browsing, shopping cart management, and secure cryptocurrency payment processing.

## Tech Stack

### Frontend
- **Next.js 15.2** with App Router
- **React 19**
- **TypeScript**
- **Material UI 7** for UI components and styling
- **Emotion** for styled components

### Backend & Database
- **Next.js API Routes** for serverless functions
- **PostgreSQL** database
- **Prisma ORM** for database operations
- **Supabase** for authentication services

### Cryptocurrency Integration
- **MeshConnect** for cryptocurrency wallet integration
- Support for USDC payments

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL database
- Supabase account
- MeshConnect account

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration (Authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MeshConnect Configuration (Crypto Wallet Integration)
MESH_CLIENT_ID=your_mesh_client_id
MESH_API_SECRET=your_mesh_api_secret

# Cryptocurrency Payment Settings
RECEIVING_WALLET_ADDRESS=your_wallet_address
PAYMENT_NETWORK_ID=your_payment_network_id
PAYMENT_SYMBOL=USDC

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/shop_icy
```

### Database Setup

1. Ensure your PostgreSQL database is running and accessible
2. Run the Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev
```

3. Generate the Prisma client:

```bash
npx prisma generate
```

### Starting the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/prisma` - Database schema and migrations
- `/lib` - Utility functions and shared code
- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - Reusable React components
- `/src/styles` - Theme configuration and global styles
- `/src/utils` - Helper utilities and integrations (Supabase, etc.)

## Features

- **User Authentication** - Sign up, login, and profile management
- **Product Browsing** - View and search for products
- **Shopping Cart** - Add products to cart and manage quantities
- **Checkout Process** - Complete purchases using cryptocurrency
- **Order Management** - View and track order history
- **Cryptocurrency Wallet Integration** - Connect your Coinbase wallet and make payments

## Prisma Database Models

The application uses the following database models:

- **User** - User accounts and authentication data
- **CryptoAccount** - Linked cryptocurrency wallets
- **Product** - Available products for purchase
- **Order** - Customer orders
- **OrderItem** - Individual items within an order
- **Transaction** - Cryptocurrency transaction details
- **Cart** - Shopping cart for users
- **CartItem** - Individual items in a shopping cart

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/products` - Product management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order processing
- `/api/mesh` - Cryptocurrency wallet integration
- `/api/linktoken` - MeshConnect token generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License

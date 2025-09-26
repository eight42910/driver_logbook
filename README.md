This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and integrated with [microCMS](https://microcms.io) for content management.

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory and add your microCMS configuration:

```bash
# microCMS Configuration
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. microCMS Setup

1. Create a microCMS account at [https://microcms.io](https://microcms.io)
2. Create a new service
3. Create an API called "blogs" with the following schema:
   - title (Text Field)
   - content (Rich Text Editor)
   - description (Text Field) - optional
   - thumbnail (Media) - optional
   - category (Reference to Category API) - optional
   - tags (Multiple Reference to Tag API) - optional

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn install && yarn dev
# or
pnpm install && pnpm dev
# or
bun install && bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Version Information

This template uses the following stable versions of the main libraries:

*   **Next.js:** 14.2.32
*   **React:** 18.3.1
*   **Tailwind CSS:** 3.4.17

These versions have been selected to ensure stability and compatibility.

## How to Use This Template

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your environment variables:**
    Create a `.env.local` file in the root of your project and add the following:
    ```
    MICROCMS_SERVICE_DOMAIN=your-service-id
    MICROCMS_API_KEY=your-api-key
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
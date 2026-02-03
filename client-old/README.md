# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Configuration

Create a `.env` file at the project root (`client/.env`) and add the backend API base URL:

```
VITE_API_BASE=http://localhost:9000
```

This value is used by the frontend to call the backend API endpoints.

## Run

Start the development server:

```pwsh
cd client
npm install
npm run dev
```

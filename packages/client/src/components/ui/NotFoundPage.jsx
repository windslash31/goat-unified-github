import React from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "./Button";

export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <SearchX className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500" />
    <h1 className="mt-6 text-4xl font-bold text-gray-800 dark:text-gray-200">
      404 - Not Found
    </h1>
    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
      Sorry, the page you are looking for does not exist.
    </p>
    <div className="mt-8">
      <Link to="/dashboard">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>
    </div>
  </div>
);

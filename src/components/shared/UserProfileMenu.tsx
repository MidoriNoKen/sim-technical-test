"use client";

import React from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileMenuProps {
  role: "ADMIN" | "CUSTOMER";
  onLogout: () => void;
  email?: string;
  name?: string;
}

export function UserProfileMenu({ role, onLogout, email, name }: UserProfileMenuProps) {
  const defaultName = name || (role === "ADMIN" ? "Admin User" : "Customer");
  const defaultEmail = email || (role === "ADMIN" ? "admin@solutech.id" : "customer@solutech.id");
  const initial = defaultName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-slate-800 hover:bg-slate-850 text-slate-300 rounded-full sm:rounded-md px-2 sm:px-4">
          <div className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold">
            {initial}
          </div>
          <span className="text-xs font-medium hidden sm:inline">{defaultName}</span>
          <ChevronDown className="h-3 w-3 text-slate-500 hidden sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-slate-200">{defaultName}</p>
            <p className="text-xs leading-none text-slate-500">{defaultEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem className="cursor-pointer text-slate-300 focus:bg-slate-800 focus:text-slate-200">
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

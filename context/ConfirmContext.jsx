"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ConfirmContext = createContext();

export const useConfirm = () => {
    return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: "",
        description: "",
        resolve: null,
    });

    const confirm = useCallback((description, title = "Xác nhận hành động") => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                description,
                resolve,
            });
        });
    }, []);

    const handleClose = () => {
        setState((prev) => {
            if (prev.resolve) prev.resolve(false);
            return { ...prev, isOpen: false };
        });
    };

    const handleConfirm = () => {
        setState((prev) => {
            if (prev.resolve) prev.resolve(true);
            return { ...prev, isOpen: false };
        });
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && handleClose()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state.title}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
                            {state.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel onClick={handleClose}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                            Xác nhận
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
};

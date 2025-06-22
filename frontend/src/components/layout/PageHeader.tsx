import React from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "../ui/Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
  showLogo?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref,
  onBackClick,
  rightAction,
  showLogo = true,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
      <div className="flex items-center gap-4 sm:gap-6">
        {showLogo && (
          <div className="w-12 sm:w-16 bg-gray-200 rounded-full px-2 py-1">
            <Link href="/">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={60}
                height={60}
                className="cursor-pointer"
              />
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 text-sm sm:text-base">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {showBackButton && (
          <>
            {backButtonHref ? (
              <Link href={backButtonHref}>
                <Button variant="outline" className="w-full sm:w-auto">
                  {backButtonText}
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={onBackClick}
                className="w-full sm:w-auto"
              >
                {backButtonText}
              </Button>
            )}
          </>
        )}
        {rightAction}
      </div>
    </div>
  );
}

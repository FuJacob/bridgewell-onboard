"use client";

import React from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useEffect } from "react";
const page = () => {
  useEffect(() => {
    const fetchData = async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from("clients").select("*");
      console.log(data);
    };
      
      fetchData();
  }, []);
  return <div></div>;
};

export default page;

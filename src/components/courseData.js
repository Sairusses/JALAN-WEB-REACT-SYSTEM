import { supabase } from "../supabaseClient";

export async function fetchAllCourses() {
  const { data, error } = await supabase.from("courses").select("*");
  if (error) throw error;
  return data;
}
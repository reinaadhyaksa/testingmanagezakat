// src/services/activityService.js
import { supabase } from "./supabase"

export const activityService = {
    // Get all activities
    async getAllActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Get activity by ID
    async getActivityById(id) {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Create new activity (tanpa user_id)
    async createActivity(activityData) {
        const { data, error } = await supabase
            .from('activities')
            .insert([activityData])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update activity
    async updateActivity(id, activityData) {
        const { data, error } = await supabase
            .from('activities')
            .update(activityData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete activity
    async deleteActivity(id) {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
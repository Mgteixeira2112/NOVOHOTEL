import { supabase } from '../lib/supabase';

export type TaskType='ROOM_CLEANING'|'ROOM_INSPECTION'|'MAINTENANCE'|'MINIBAR'|'LAUNDRY'|'DELIVERY'|'RESTOCK'|'GENERAL';
export type TaskStatus='PENDING'|'IN_PROGRESS'|'WAITING'|'COMPLETED'|'CANCELLED'|'REOPENED';
export const taskRepository={
 async list(hotelId:string,type?:TaskType){let q=supabase.from('hotel_os_tasks').select('*').eq('hotel_id',hotelId).order('priority').order('created_at',{ascending:true});if(type)q=q.eq('type',type);const {data,error}=await q;if(error)throw error;return data??[];},
 async create(input:{hotelId:string;type:TaskType;title:string;description?:string;roomId?:string;priority?:string;source?:string;assignedTo?:string|null;dueAt?:string|null}){const {data,error}=await supabase.from('hotel_os_tasks').insert({hotel_id:input.hotelId,type:input.type,title:input.title,description:input.description??null,room_id:input.roomId??null,priority:input.priority??'NORMAL',source:input.source??'MANUAL',assigned_to:input.assignedTo??null,due_at:input.dueAt??null}).select().single();if(error)throw error;return data;},
 async transition(taskId:string,status:TaskStatus,reason?:string){const {data,error}=await supabase.rpc('hotel_os_transition_task',{p_task_id:taskId,p_status:status,p_reason:reason??null});if(error)throw error;return String(data);},
 async inspection(taskId:string,approved:boolean,reason?:string){const {data,error}=await supabase.rpc('hotel_os_complete_room_inspection',{p_task_id:taskId,p_approved:approved,p_reason:reason??null});if(error)throw error;return String(data);},
 async listBoards(hotelId:string){const {data,error}=await supabase.from('hotel_os_boards').select('*,columns:hotel_os_board_columns(*)').eq('hotel_id',hotelId).eq('active',true);if(error)throw error;return data??[];},
};

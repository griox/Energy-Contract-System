import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {resellerService} from "../services/customerService/ResellerService";
import { toast } from "sonner"; // Đảm bảo đường dẫn đúng

// 1. Định nghĩa Schema Validation bằng Zod
const formSchema = z.object({
    name: z.string().min(2, {
        message: "Tên đại lý phải có ít nhất 2 ký tự.",
    }),
    type: z.string().min(1, {
        message: "Vui lòng nhập loại hình kinh doanh.",
    }),
});

// Định nghĩa Props cho component
interface CreateResellerDialogProps {
    onSuccess: () => void; // Hàm callback để báo cho trang cha biết là đã tạo xong
}

export function CreateResellerDialog({ onSuccess }: CreateResellerDialogProps) {
    const [open, setOpen] = useState(false); // Quản lý đóng/mở Modal
    const [loading, setLoading] = useState(false);

    // 2. Khởi tạo Form với React Hook Form và Zod
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "",
        },
    });

    // 3. Hàm xử lý khi nhấn Submit
    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true);

            // Gọi Service để tạo mới
            // values ở đây sẽ là { name: "...", type: "..." } đúng với Omit<Reseller, 'id'>
            await resellerService.create(values);

            // Reset form, đóng modal và báo cho trang cha load lại dữ liệu
            form.reset();
            setOpen(false);
            onSuccess();

        } catch (error) {
            console.error("Lỗi khi tạo reseller:", error);
            // Bạn có thể dùng toast để hiện lỗi nếu muốn
            alert("Có lỗi xảy ra khi tạo mới!");
            toast.error("Error while create a new reseller")
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Thêm Đại Lý Mới</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm Đại Lý</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin đại lý mới vào bên dưới. Nhấn lưu để hoàn tất.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Input Tên Đại Lý */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên Đại Lý</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: VinMart" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Input Loại Hình */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại Hình</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Agency" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


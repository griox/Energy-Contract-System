# Dùng bản mới nhất
FROM datalust/seq:latest

# 1. Chuyển sang quyền Root
USER root

# 2. Chấp nhận điều khoản
ENV ACCEPT_EULA=Y

# 👇 3. THÊM DÒNG NÀY: Đặt mật khẩu Admin mặc định (Bạn tự đổi pass nhé)
ENV SEQ_FIRSTRUN_ADMINPASSWORD="Password123!"

# 4. CHIẾN THUẬT COPY FILE (Giữ nguyên cái này vì nó đang hoạt động tốt)
RUN cp /seqsvr/Seq /seqsvr/Seq-custom && chmod +x /seqsvr/Seq-custom

# 5. Chạy bằng file mới
ENTRYPOINT ["/seqsvr/Seq-custom", "run"]
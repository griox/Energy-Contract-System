# Dùng bản mới nhất
FROM datalust/seq:latest

# 1. Chuyển sang quyền Root
USER root

# 2. Chấp nhận điều khoản
ENV ACCEPT_EULA=Y

# 3. CHIẾN THUẬT QUAN TRỌNG:
# Thay vì cố sửa quyền file gốc (bị Render chặn), ta copy nó ra thành file mới.
# File mới này do chính Root tạo ra nên Render bắt buộc phải cấp quyền chạy.
RUN cp /seqsvr/Seq /seqsvr/Seq-custom && chmod +x /seqsvr/Seq-custom

# 4. Chạy bằng file mới tạo
ENTRYPOINT ["/seqsvr/Seq-custom", "run"]
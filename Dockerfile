FROM datalust/seq:2024.1

# Chuyển quyền root
USER root

# 👇 QUAN TRỌNG: Cấp quyền thực thi cho file (Bạn đang thiếu dòng này)
RUN chmod +x /seqsvr/Seq

# Biến môi trường
ENV ACCEPT_EULA="Y"

# Chạy Seq
ENTRYPOINT ["/seqsvr/Seq", "run"]
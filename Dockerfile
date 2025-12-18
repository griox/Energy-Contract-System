FROM datalust/seq:2024.1

# Chuyển sang quyền root để có thể ghi vào ổ đĩa của Render
USER root

# (Tùy chọn) Biến môi trường để Seq chấp nhận chạy dưới quyền root
ENV SEQ_FIRSTRUN_ADMINPASSWORDHASH="" 
ENV ACCEPT_EULA="Y"

# Chạy Seq
ENTRYPOINT ["/bin/seqsvr/Seq", "run"]
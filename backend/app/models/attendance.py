from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    rehearsal_plan_id = Column(Integer, ForeignKey("rehearsal_plans.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    status = Column(String, nullable=False)  # Present / Absent / Excused / Late
    remarks = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("rehearsal_plan_id", "member_id", name="uq_attendance_plan_member"),
    )

    member = relationship("Member", back_populates="attendance_records")

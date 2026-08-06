from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    # Exactly one of these two should be set — enforced at the application
    # level (checked in the endpoints), not a DB CHECK constraint, since
    # that would add complexity out of proportion to this app's scale.
    rehearsal_plan_id = Column(Integer, ForeignKey("rehearsal_plans.id"), nullable=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    status = Column(String, nullable=False)  # Present / Absent / Excused / Late
    remarks = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("rehearsal_plan_id", "member_id", name="uq_attendance_plan_member"),
        UniqueConstraint("gig_id", "member_id", name="uq_attendance_gig_member"),
    )

    member = relationship("Member", back_populates="attendance_records")

from sqlalchemy import Column, Integer, String
from app.database import Base

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Active")
    section = Column(String, nullable=False)
    subsection = Column(Integer, nullable=True)  # 1 or 2, nullable — not every section needs a split
    remarks = Column(String, nullable=True)

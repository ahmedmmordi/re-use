using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Repository
{

    public interface IBaseRepository<T> where T : class
    {
        public Task<T?> GetByIdAsync(Guid id);
        void Add(T entity);
        void Remove(T entity);
        public void Update(T entity);
    }
}